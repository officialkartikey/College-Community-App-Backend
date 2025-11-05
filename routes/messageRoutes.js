import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, fetchMessages } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", protect, sendMessage);          // Send message
router.get("/:chatId", protect, fetchMessages);  // Get messages of chat

export default router;
