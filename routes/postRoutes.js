import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ import auth middleware
import {
  createPost,
  getAllPosts,
  likePost,
  dislikePost,
} from "../controllers/postController.js";

const router = express.Router();

// 🟢 Create Post (Protected)
router.post("/create", protect, upload.single("media"), createPost);

// 🟢 Get All Posts (Public)
router.get("/", getAllPosts);

// 🟢 Like Post (Protected)
router.post("/:id/like", protect, likePost);

// 🟢 Dislike Post (Protected)
router.post("/:id/dislike", protect, dislikePost);

export default router;



