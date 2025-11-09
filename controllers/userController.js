import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import Post from "../models/post.js";
import Comment from "../models/comment.js";




/**
 * @desc Register a new user
 * @route POST /api/users/register
 * @access Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, branch, interests, year } = req.body;

    if (!name || !email || !password || !branch || !year) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      branch,
      interests,
      year,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        branch: newUser.branch,
        year: newUser.year,
        interests: newUser.interests,
      },
      token,
    });
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Login user
 * @route POST /api/users/login
 * @access Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        interests: user.interests,
      },
      token,
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    
    const response = await axios.post(
      "https://user-recommendation-1.onrender.com/recommend_users/",
      { user_id: currentUserId, top_n: 10 },
      { headers: { "Content-Type": "application/json" } }
    );

    if (!response.data || !response.data.recommended_users) {
      return res.status(500).json({
        message: "FastAPI did not return recommended users",
        data: response.data
      });
    }

    const recommendedUserIds = response.data.recommended_users.map(u => u.user_id);

    
    const recommendedUserObjectIds = recommendedUserIds.map(id => new mongoose.Types.ObjectId(id));

    const recommendedUsers = await User.find({ _id: { $in: recommendedUserObjectIds } }).select("-password");

    res.status(200).json({
      success: true,
      recommended_users: recommendedUsers
    });
  } catch (error) {
    console.error("Error in getRecommendedUsers:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch recommended users",
      error: error.response?.data || error.message
    });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
