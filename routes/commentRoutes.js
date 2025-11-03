import express from "express";
import { addComment } from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ import auth middleware

const router = express.Router();

// 🟢 Add comment to a post (Protected)
router.post("/add", protect, addComment);

export default router;

