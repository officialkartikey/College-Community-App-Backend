import express from "express";
import { addComment,
    getCommentsByPost,

 } from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.get("/:postId", getCommentsByPost);
router.post("/add", protect, addComment);

export default router;

