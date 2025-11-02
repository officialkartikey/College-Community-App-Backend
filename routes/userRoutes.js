import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
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

// Example: you can add more protected routes here
// router.put("/update-profile", protect, updateProfile);

export default router;
