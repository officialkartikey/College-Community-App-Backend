import express from "express";
import upload from "../middleware/uploadMiddleware.js"; // ✅ use our custom multer setup
import { protect } from "../middleware/authMiddleware.js";
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

// 🟢 Like / Dislike
router.post("/:id/like", protect, likePost);
router.post("/:id/dislike", protect, dislikePost);

export default router;




