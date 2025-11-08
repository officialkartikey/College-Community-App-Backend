import express from "express";
import { addComment } from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();


router.post("/add", protect, addComment);

export default router;

