import path from "path";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";        // ✅ Add chat routes
import messageRoutes from "./routes/messageRoutes.js";  // ✅ Add message routes
import multer from "multer"; 
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

// ✅ Create HTTP server (required for socket.io)
const server = http.createServer(app);

// ✅ Setup socket server
const io = new Server(server, {
  pingTimeout: 60000,
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  // User joins personal room
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  // User joins chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("📌 User joined chat:", room);
  });

  // Real-time outgoing message to multiple users
  socket.on("new message", (message) => {
    const chat = message.chat;
    if (!chat || !chat.users) return;

    chat.users.forEach((user) => {
      if (user._id === message.sender._id) return; // Skip sender
      socket.to(user._id).emit("message received", message);
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected");
  });
});

// ============================================================================
// ✅ APP CONFIG
// ============================================================================

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ============================================================================
// ✅ ROUTES
// ============================================================================
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);        // ✅ Chat APIs
app.use("/api/message", messageRoutes);  // ✅ Message APIs

app.get("/", (req, res) => {
  return res.render("homepage.ejs");
});

// ============================================================================
// ✅ START SERVER
// ============================================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server + Socket Running on port ${PORT}`)
);
