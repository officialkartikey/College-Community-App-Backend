import multer from "multer";
import fs from "fs";
import path from "path";

// 🧱 Ensure upload folders exist (for diskStorage)
const ensureUploadFolders = () => {
  const folders = ["uploads/images", "uploads/videos", "uploads/others"];
  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
};

// 🔹 1️⃣ Disk Storage (for createPost API)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadFolders();

    if (file.mimetype.startsWith("image")) {
      cb(null, "uploads/images");
    } else if (file.mimetype.startsWith("video")) {
      cb(null, "uploads/videos");
    } else {
      cb(null, "uploads/others");
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// 🔹 2️⃣ Memory Storage (for Cloudinary streaming — profile upload)
const memoryStorage = multer.memoryStorage();

// 🔹 Common file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type. Only image and video files are allowed!"), false);
  }
};

// 🔹 Disk-based upload (used in createPost API)
export const uploadToDisk = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// 🔹 Memory-based upload (used in uploadProfilePhoto API)
export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
});


