import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js"; // ✅ Added comment routes

dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Serve uploaded media files (so images/videos are accessible from browser)
app.use("/uploads", express.static("uploads"));

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes); // Post routes (create, like, dislike, etc.)
app.use("/api/comments", commentRoutes); // Comment routes (add, get, etc.)

// ✅ Root route (for quick testing)
app.get("/", (req, res) => {
  res.send("🚀 College Community API is running...");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

