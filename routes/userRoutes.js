import express from "express";
import { registerUser, 
  loginUser,
   getRecommendedUsers,
    getUserEngagement,
  getAllUsers, } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔒 Profile Example
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to your profile!",
    user: req.user,
  });
});

// 🔒 Recommended Users
router.get("/recommended", protect, getRecommendedUsers);

// 🔒 Engagement - Posts Liked & Disliked by user
router.get("/engagement", protect, getUserEngagement);
router.get("/all", protect, getAllUsers);

export default router;
