import axios from "axios";
import Comment from "../models/comment.js";

const SPAM_API_URL = "https://spam-yege.onrender.com/predict"; // final working endpoint
const SPAM_THRESHOLD = 0.5; // score >= 0.5 → spam
const SPAM_ACTION = "reject"; // "reject" = block, "flag" = save but marked as spam

async function querySpamApi(text) {
  try {
    const response = await axios.post(SPAM_API_URL, { text });
    const data = response.data;

    // Expected formats supported here:
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
    return { checked: false }; // Fail-safe: do not block comments if API is down
  }
}

export const addComment = async (req, res) => {
  try {
    const { postId, user, text } = req.body;
    if (!postId || !user || !text) {
      return res.status(400).json({ message: "postId, user and text are required." });
    }

    // Call spam model
    const spamResult = await querySpamApi(text);

    // If API detected spam AND action is reject → block comment
    if (spamResult.checked && spamResult.isSpam && SPAM_ACTION === "reject") {
      return res.status(400).json({
        message: "❌ Comment blocked: System detected spam.",
        spamScore: spamResult.score,
        spamLabel: spamResult.label,
      });
    }

    // Otherwise → save comment (flag if spam)
    const comment = await Comment.create({
      post: postId,
      user,
      text,
      spam: spamResult.checked ? spamResult.isSpam : false,
      spamChecked: spamResult.checked,
      spamScore: spamResult.score,
      spamLabel: spamResult.label,
    });

    // If spam but flagged → tell user
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
