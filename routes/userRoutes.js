import express from "express";
import { registerUser, loginUser, getRecommendedUsers } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔒 Protected Routes (require valid JWT)
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to your profile!",
    user: req.user, // Comes from auth middleware
  });
});

// 🔒 Recommended Users
router.get("/recommended", protect, getRecommendedUsers);

export default router;
