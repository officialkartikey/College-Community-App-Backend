import express from "express";
import upload from "../middleware/uploadMiddleware.js"; 
import { protect } from "../middleware/authMiddleware.js";
import { 
  createPost, 
  getAllPosts, 
  likePost, 
  dislikePost, 
  getRecommendedFeed,
  deletePost,
  updatePost  
} from "../controllers/postController.js";

const router = express.Router();

// 🟢 Create Post (Cloudinary)
router.post("/create", protect, upload.single("media"), createPost);

// ✏️ Update Post (Cloudinary)
router.put("/:id", protect, upload.single("media"), updatePost);

// 📋 Get All Posts
router.get("/all", protect, getAllPosts);

// ⚙️ Recommended Feed
router.get("/feed", protect, getRecommendedFeed);

// ❤️ Like Post
router.post("/:id/like", protect, likePost);

// 💔 Dislike Post
router.post("/:id/dislike", protect, dislikePost);

// 🗑️ Delete Post
router.delete("/:id", protect, deletePost);

export default router;




