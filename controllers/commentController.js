// controllers/commentController.js
import Comment from "../models/comment.js";

export const addComment = async (req, res) => {
  try {
    const { postId, user, text } = req.body;
    const comment = new Comment({ post: postId, user, text });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
