import express from "express";
import upload from "../middleware/uploadMiddleware.js"; // ✅ custom multer
import { protect } from "../middleware/authMiddleware.js";
import { 
  createPost, 
  getAllPosts, 
  likePost, 
  dislikePost, 
  getRecommendedFeed 
} from "../controllers/postController.js";

const router = express.Router();

// 🟢 Create Post (Protected)
router.post("/create", protect, upload.single("media"), createPost);

// 🟢 Get All Posts (Protected)
router.get("/all", protect, getAllPosts);  // fetch all posts

// 🟢 Recommended Feed (Protected)
router.get("/feed", protect, getRecommendedFeed);

// 🟢 Like / Dislike Post (Protected)
router.post("/:id/like", protect, likePost);
router.post("/:id/dislike", protect, dislikePost);

export default router;



