import express from "express";
import { uploadToDisk } from "../middleware/uploadMiddleware.js"; // ✅ Correct import
import { protect } from "../middleware/authMiddleware.js";
import {
  createPost,
  getAllPosts,
  likePost,
  dislikePost,
  getRecommendedFeed,
  deletePost,
  updatePost,
  getLikedPosts,
  getMyPosts,
} from "../controllers/postController.js";

const router = express.Router();

// 🔹 Create / Update Post (Image or Video Upload)
router.post("/create", protect, uploadToDisk.single("media"), createPost);
router.put("/:id", protect, uploadToDisk.single("media"), updatePost);

// 🔹 Fetch Posts
router.get("/all", protect, getAllPosts);
router.get("/feed", protect, getRecommendedFeed);
router.get("/liked", protect, getLikedPosts);
router.get("/mine", protect, getMyPosts);

// 🔹 Like / Dislike
router.post("/:id/like", protect, likePost);
router.post("/:id/dislike", protect, dislikePost);

// 🔹 Delete
router.delete("/:id", protect, deletePost);

export default router;



