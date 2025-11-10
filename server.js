import path from "path";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

// 🧩 Import Routes
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

// ✅ Create HTTP Server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ REMOVE local uploads folder (Cloudinary stores media now)
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ✅ Root Test Endpoint
app.get("/", (req, res) => {
  res.send("API is running successfully 🚀");
});

// ✅ Socket.IO Setup
io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  // 1️⃣ When user connects from Flutter/Web app
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
    console.log("👤 User connected:", userData._id);
  });

  // 2️⃣ Join a specific chat room
  socket.on("join chat", (roomId) => {
    socket.join(roomId);
    console.log(`📌 User joined room: ${roomId}`);
  });

  // 3️⃣ When a new message is sent
  socket.on("sendMessage", async (messageData) => {
    try {
      console.log("💬 New message received via socket:", messageData);

      const chat = messageData.chat;
      if (!chat?.users) {
        console.warn("⚠️ No users found in chat.");
        return;
      }

      // ✅ Emit message to everyone in that chat room (except sender)
      io.to(chat._id).emit("newMessage", messageData);
      console.log("✅ Emitted newMessage to room:", chat._id);
    } catch (error) {
      console.error("❌ Socket message error:", error.message);
    }
  });

  // 4️⃣ When user disconnects
  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});


// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});
