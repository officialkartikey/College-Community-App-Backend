import axios from "axios";
import Comment from "../models/comment.js";

const SPAM_API_URL = "https://spam-yege.onrender.com/predict"; 
const SPAM_THRESHOLD = 0.5; 
const SPAM_ACTION = "reject"; 

async function querySpamApi(text) {
  try {
    const response = await axios.post(SPAM_API_URL, { text });
    const data = response.data;

    
    const score = data.probability || data.score || null;
    const isSpam =
      data.spam ||
      data.is_spam ||
      data.prediction === "spam" ||
      (score !== null && score >= SPAM_THRESHOLD);

    return {
      checked: true,
      isSpam: !!isSpam,
      score: score,
      label: data.prediction || data.label || null,
    };
  } catch (err) {
    console.log("⚠️ Spam API unavailable → skipping spam check.");
    return { checked: false }; 
  }
}

export const addComment = async (req, res) => {
  try {
    const { postId, user, text } = req.body;
    if (!postId || !user || !text) {
      return res.status(400).json({ message: "postId, user and text are required." });
    }

    
    const spamResult = await querySpamApi(text);

    
    if (spamResult.checked && spamResult.isSpam && SPAM_ACTION === "reject") {
      return res.status(400).json({
        message: "❌ Comment blocked: System detected spam.",
        spamScore: spamResult.score,
        spamLabel: spamResult.label,
      });
    }

    
    const comment = await Comment.create({
      post: postId,
      user,
      text,
      spam: spamResult.checked ? spamResult.isSpam : false,
      spamChecked: spamResult.checked,
      spamScore: spamResult.score,
      spamLabel: spamResult.label,
    });

    
    if (spamResult.checked && spamResult.isSpam && SPAM_ACTION === "flag") {
      return res.status(201).json({
        message: "⚠️ Comment saved but flagged as spam for moderation.",
        comment,
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
