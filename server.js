import path from "path";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const __dirname = path.resolve(); // ✅ For static path on Render

// ✅ Create HTTP server (for socket.io)
const server = http.createServer(app);

// ✅ Setup socket.io with CORS for Render
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", // or use your frontend Render URL for security
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("📌 User joined chat:", room);
  });

  socket.on("new message", (message) => {
    const chat = message.chat;
    if (!chat?.users) return;
    chat.users.forEach((user) => {
      if (user._id === message.sender._id) return;
      socket.to(user._id).emit("message received", message);
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

// ============================================================================
// ✅ APP CONFIG
// ============================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploads folder correctly on Render
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// ============================================================================
// ✅ ROUTES
// ============================================================================
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ✅ Default route
app.get("/", (req, res) => {
  res.send("API is running successfully 🚀");
});

// ============================================================================
// ✅ START SERVER (Render requires process.env.PORT)
// ============================================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket Running on port ${PORT}`);
});
