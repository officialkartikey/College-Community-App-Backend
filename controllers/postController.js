import Post from "../models/post.js";
import axios from "axios";
import cloudinary from "../config/cloudinary.js";


const checkSpam = async (text) => {
  try {
    const response = await axios.post(
      process.env.SPAM_API_URL,
      { text },
      { timeout: process.env.SPAM_TIMEOUT_MS || 3000 }
    );

    const { spam, probability } = response.data;

    const threshold = parseFloat(process.env.SPAM_THRESHOLD) || 0.5;
    const action = process.env.SPAM_ACTION || "reject";

    if (spam && probability > threshold) {
      return { isSpam: true, action, probability };
    }
    return { isSpam: false, probability };
  } catch (err) {
    console.error("Spam check failed:", err.message);
    return { isSpam: false, error: true };
  }
};


export const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    let { title, description, category } = req.body;
    const file = req.file;

    // 🧩 Validate input
    if (!userId) {
      return res.status(401).json({ message: "Authentication failed. User ID missing." });
    }
    if (!file) {
      return res.status(400).json({ message: "No media file uploaded." });
    }

    // 🧠 Normalize categories
    // Handles: array, JSON string, or comma-separated string
    if (typeof category === "string") {
      try {
        // Case 1: JSON string like '["Tech","AI"]'
        const parsed = JSON.parse(category);
        category = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Case 2: comma-separated like 'Tech,AI,Education'
        category = category.split(",").map((c) => c.trim());
      }
    }
    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ message: "At least one category is required." });
    }

    // 🔍 Spam check
    const spamResult = await checkSpam(`${title} ${description}`);
    if (spamResult.isSpam && spamResult.action === "reject") {
      return res.status(400).json({ message: "Spam content detected. Post rejected." });
    }

    // ☁️ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "college-community/posts",
      resource_type: "auto",
    });

    // 🧩 Save Post in DB
    const newPost = new Post({
      title,
      description,
      category,
      user: userId,
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: result.secure_url,
      public_id: result.public_id,
      isSpam: spamResult.isSpam || false,
    });

    await newPost.save();

    res.status(201).json({
      message: "✅ Post created successfully",
      post: newPost,
      spamCheck: spamResult,
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ message: "Failed to create post.", error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { title, description, category } = req.body;
    const file = req.file;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized: You cannot edit this post" });
    }

   
    if (title || description) {
      const spamResult = await checkSpam(`${title || post.title} ${description || post.description}`);
      if (spamResult.isSpam && spamResult.action === "reject") {
        return res.status(400).json({ message: "Spam content detected. Post not updated." });
      }
    }

    
    if (file) {
      if (post.public_id) {
        await cloudinary.uploader.destroy(post.public_id, {
          resource_type: post.mediaType === "video" ? "video" : "image",
        });
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "college-community/posts",
        resource_type: "auto",
      });

      post.mediaUrl = result.secure_url;
      post.public_id = result.public_id;
      post.mediaType = file.mimetype.startsWith("image") ? "image" : "video";
    }

    
    if (title) post.title = title;
    if (description) post.description = description;
    if (category) post.category = category;

    await post.save();
    res.status(200).json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    console.error("Error updating post:", error.message);
    res.status(500).json({ message: "Failed to update post", error: error.message });
  }
};


export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.body.user;

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      post.dislikes = post.dislikes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json({ message: "Post liked", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.body.user;

    if (!post.dislikes.includes(userId)) {
      post.dislikes.push(userId);
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json({ message: "Post disliked", dislikes: post.dislikes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name email");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecommendedFeed = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const response = await axios.post(
      "https://feed-recommendation-3.onrender.com/recommend_posts/",
      { user_id: userId },
      { headers: { "Content-Type": "application/json" } }
    );

    const recommendedPosts = response.data.recommendations;
    if (!Array.isArray(recommendedPosts) || recommendedPosts.length === 0) {
      return res.status(200).json([]);
    }

    const recommendedIds = recommendedPosts.map((p) => p.post_id);
    let posts = await Post.find({ _id: { $in: recommendedIds } }).populate("user", "name email");

    // Preserve order
    posts = recommendedIds.map((id) => posts.find((p) => p._id.toString() === id)).filter(Boolean);

    res.status(200).json(posts);
  } catch (error) {
    console.error("Feed Recommendation Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Error generating recommended feed",
      error: error.response?.data || error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized: You cannot delete this post" });
    }

   
    if (post.public_id) {
      await cloudinary.uploader.destroy(post.public_id, {
        resource_type: post.mediaType === "video" ? "video" : "image",
      });
    }


    await Post.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ message: "Failed to delete post", error: error.message });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔹 Find all posts where the user has liked
    const likedPosts = await Post.find({ likes: userId })
      .populate("user", "name email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalLiked: likedPosts.length,
      likedPosts,
    });
  } catch (error) {
    console.error("Error fetching liked posts:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🔹 Find all posts created by this user
    const myPosts = await Post.find({ user: userId })
      .populate("user", "name email profilePic") // Include creator details
      .sort({ createdAt: -1 }); // Newest first

    if (!myPosts.length) {
      return res.status(404).json({
        success: false,
        message: "You haven't posted anything yet.",
      });
    }

    res.status(200).json({
      success: true,
      count: myPosts.length,
      posts: myPosts,
    });
  } catch (error) {
    console.error("❌ Error fetching user posts:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

