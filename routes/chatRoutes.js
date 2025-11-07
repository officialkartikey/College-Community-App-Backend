import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
       leaveGroup,
       getGroupMembers,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", protect, accessChat);
router.get("/", protect, fetchChats);
router.post("/group", protect, createGroupChat);
router.put("/group/rename", protect, renameGroup);
router.put("/group/add", protect, addToGroup);
router.put("/group/remove", protect, removeFromGroup);
router.post("/leave", protect, leaveGroup);
router.get("/members/:chatId", protect, getGroupMembers);

export default router;
