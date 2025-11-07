import Post from "../models/post.js";
import axios from "axios";

// 🟢 Create Post
export const createPost = async (req, res) => {
  try {
    // 1. Get user ID securely from the JWT middleware (req.user)
    //    We assume your JWT middleware decodes the token and places the user's ID 
    //    at req.user._id (or req.user.id).
    const userId = req.user._id; 
    
    // 2. Get post data from the request body
    //    **Important:** Remove 'user' from destructuring, as it's now ignored from req.body.
    const { title, description, category } = req.body; 
    const file = req.file;

    // Guard against missing authenticated user ID (though middleware should handle this)
    if (!userId) {
      return res.status(401).json({ message: "Authentication failed. User ID missing." });
    }

    const newPost = new Post({
      title,
      description,
      category,
      // 3. SECURE CHANGE: Use the authenticated ID from the token, NOT from req.body
      user: userId, 
      mediaType: file?.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: `/uploads/${file?.mimetype.startsWith("image") ? "images" : "videos"}/${file?.filename}`,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    // If a post lacks a required field (like title or category), Mongoose will throw an error here.
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post.", error: error.message });
  }
};
// 🟢 Like Post
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.body.user;

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      post.dislikes = post.dislikes.filter(id => id.toString() !== userId);
    }

    await post.save();
    res.json({ message: "Post liked", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Dislike Post
export const dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.body.user;

    if (!post.dislikes.includes(userId)) {
      post.dislikes.push(userId);
      post.likes = post.likes.filter(id => id.toString() !== userId);
    }

    await post.save();
    res.json({ message: "Post disliked", dislikes: post.dislikes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get All Posts (Normal Feed)
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name email");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Recommended Feed (AI Based Feed)
export const getRecommendedFeed = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const response = await axios.post(
      "https://feed-recommendation-3.onrender.com/recommend_posts/",
      { user_id: userId },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("FASTAPI RESPONSE:", response.data);

    const recommendedPosts = response.data.recommendations;

    // If no recommendations, return empty feed
    if (!Array.isArray(recommendedPosts) || recommendedPosts.length === 0) {
      return res.status(200).json([]);
    }

    const recommendedIds = recommendedPosts.map(p => p.post_id);

    let posts = await Post.find({ _id: { $in: recommendedIds } })
      .populate("user", "name email");

    // Maintain recommended ranking order
    posts = recommendedIds
      .map(id => posts.find(p => p._id.toString() === id))
      .filter(Boolean);

    res.status(200).json(posts);

  } catch (error) {
    console.error("Feed Recommendation Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Error generating recommended feed",
      error: error.response?.data || error.message
    });
  }
};



