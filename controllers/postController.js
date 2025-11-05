import Post from "../models/post.js";

// 🟢 Create Post
export const  createPost = async (req, res) => {
  try {
    const { title, description, category, user } = req.body;
    const file = req.file;

    const newPost = new Post({
      title,
      description,
      category,
      user,
      mediaType: file?.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: `/uploads/${file?.mimetype.startsWith("image") ? "images" : "videos"}/${file?.filename}`,
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// 🟢 Get All Posts
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name email");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



