import express from "express";
import {
  registerUser,
  loginUser,
  getRecommendedUsers,
  getAllUsers,
  uploadProfilePhoto,
  resetPassword,
  forgotPassword,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadToMemory } from "../middleware/uploadMiddleware.js"; // ✅ Correct import

const router = express.Router();

// 🔹 User Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔹 Profile Info
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to your profile!",
    user: req.user,
  });
});

// 🔹 Upload Profile Image (Cloudinary)
router.post(
  "/upload-profile",
  protect,
  uploadToMemory.single("profileImage"), // ✅ Use memory-based upload
  uploadProfilePhoto
);

// 🔹 Recommended + All Users
router.get("/recommended", protect, getRecommendedUsers);
router.get("/all", protect, getAllUsers);

// Forgot Password (Send Email)
router.post("/forgot-password", forgotPassword);

// Reset Password (With token from deep link)
router.post("/reset-password/:token", resetPassword);

export default router;
