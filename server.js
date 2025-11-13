import path from "path";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
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
  .catch((err) => console.error(" MongoDB Connection Error:", err.message));

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


io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers["authorization"];
    if (!token) {
      console.warn("No token provided during socket connection");
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
    console.error(" Socket authentication failed:", err.message);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id, "->", socket.user?.name);

  socket.on("setup", (userData) => {
    socket.join(socket.userId);
    socket.emit("connected");
    console.log("👤 Joined personal room:", socket.userId);
  });


  socket.on("join chat", (roomId) => {
    socket.join(roomId);
    console.log(`🚪 ${socket.user.name} joined chat room: ${roomId}`);
  });


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

      
      const newMessage = await Message.create({
        chat: roomId,
        sender: socket.userId,
        content: message,
      });

      await newMessage.populate("sender", "name email");
      await newMessage.populate("chat", "chatName isGroupChat");

    
      io.to(roomId).emit("newMessage", newMessage);
      console.log(` Emitted newMessage to chat room: ${roomId}`);

      
      chat.users.forEach((user) => {
        io.to(user._id.toString()).emit("newMessage", newMessage);
      });

      console.log(`✅ Message from ${socket.userId} sent to ${chat.users.length} users`);
    } catch (error) {
      console.error("Socket message error:", error.message);
      socket.emit("error", { message: error.message });
    }
  });

  // 4️⃣ Handle disconnect
  socket.on("disconnect", () => {
    console.log(" Socket Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});
