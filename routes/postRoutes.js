import express from "express";
import upload from "../middleware/uploadMiddleware.js"; 
import { protect } from "../middleware/authMiddleware.js";
import { 
  createPost, 
  getAllPosts, 
  likePost, 
  dislikePost, 
  getRecommendedFeed,
  deletePost,
  updatePost  ,
  getLikedPosts,
  getMyPosts,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/create", protect, upload.single("media"), createPost);
router.put("/:id", protect, upload.single("media"), updatePost);
router.get("/all", protect, getAllPosts);
router.get("/feed", protect, getRecommendedFeed);
router.post("/:id/like", protect, likePost);
router.post("/:id/dislike", protect, dislikePost);
router.delete("/:id", protect, deletePost);
router.get("/liked", protect, getLikedPosts);
router.get("/mine", protect, getMyPosts);

export default router;




