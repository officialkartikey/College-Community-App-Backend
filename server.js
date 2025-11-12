import path from "path";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// 🧩 Import Routes
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// 🧩 Import Models
import Chat from "./models/chatModel.js";
import Message from "./models/messageModel.js";
import User from "./models/userModel.js";

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

// ✅ API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ✅ Root Endpoint
app.get("/", (req, res) => {
  res.send("API is running successfully 🚀");
});

/* ----------------------------------------------------
   🔐 SOCKET.IO AUTHENTICATION USING JWT
---------------------------------------------------- */
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers["authorization"];
    if (!token) {
      console.warn("⚠️ No token provided during socket connection");
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded.userId).select(
      "_id name email"
    );
    if (!user) return next(new Error("User not found"));

    socket.user = user;
    socket.userId = user._id.toString();

    next();
  } catch (err) {
    console.error("❌ Socket authentication failed:", err.message);
    next(new Error("Authentication error"));
  }
});

/* ----------------------------------------------------
   ⚡ SOCKET.IO EVENT HANDLERS
---------------------------------------------------- */
io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id, "->", socket.user?.name);

  // 1️⃣ Setup personal room
  socket.on("setup", (userData) => {
    socket.join(socket.userId);
    socket.emit("connected");
    console.log("👤 Joined personal room:", socket.userId);
  });

  // 2️⃣ Join specific chat room
  socket.on("join chat", (roomId) => {
    socket.join(roomId);
    console.log(`🚪 ${socket.user.name} joined chat room: ${roomId}`);
  });

  // 3️⃣ Handle new messages
  socket.on("sendMessage", async ({ roomId, message }) => {
    try {
      if (!socket.userId) {
        console.warn("⚠ Missing authenticated socket.userId");
        return socket.emit("error", { message: "Not authenticated" });
      }

      console.log("💬 Message received:", {
        roomId,
        message,
        sender: socket.userId,
      });

      const chat = await Chat.findById(roomId).populate("users", "_id name email");
      if (!chat) {
        console.warn(`⚠ Chat not found: ${roomId}`);
        return socket.emit("error", { message: "Chat not found" });
      }

      // ✅ Create new message
      const newMessage = await Message.create({
        chat: roomId,
        sender: socket.userId,
        content: message,
      });

      await newMessage.populate("sender", "name email");
      await newMessage.populate("chat", "chatName isGroupChat");

      // ✅ Emit to chat room (everyone currently in chat)
      io.to(roomId).emit("newMessage", newMessage);
      console.log(`📤 Emitted newMessage to chat room: ${roomId}`);

      // ✅ Also emit to each user's personal room (backup)
      chat.users.forEach((user) => {
        io.to(user._id.toString()).emit("newMessage", newMessage);
      });

      console.log(`✅ Message from ${socket.userId} sent to ${chat.users.length} users`);
    } catch (error) {
      console.error("❌ Socket message error:", error.message);
      socket.emit("error", { message: error.message });
    }
  });

  // 4️⃣ Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected:", socket.id);
  });
});

/* ----------------------------------------------------
   🚀 START SERVER
---------------------------------------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});
