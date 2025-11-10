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
  socket.on("sendMessage", async ({ roomId, message, sender }) => {
    try {
      console.log("💬 New message received via socket:", { roomId, message });

      // ✅ Fetch chat from MongoDB
      const chat = await Chat.findById(roomId).populate("users", "_id name email");

      if (!chat || !chat.users || chat.users.length === 0) {
        console.warn(`⚠️ No users found in chat: ${roomId}`);
        return;
      }

      // ✅ Optionally save message to DB
      const newMessage = await Message.create({
        chat: roomId,
        sender: sender?._id,
        content: message,
      });

      await newMessage.populate("sender", "name email");
      await newMessage.populate("chat", "chatName isGroupChat");

      // ✅ Broadcast to all users in that chat except sender
      chat.users.forEach((user) => {
        if (user._id.toString() !== sender?._id) {
          io.to(user._id.toString()).emit("newMessage", newMessage);
        }
      });

      console.log(`✅ Message emitted to ${chat.users.length - 1} members in room ${roomId}`);
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
