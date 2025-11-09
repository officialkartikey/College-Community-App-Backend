import multer from "multer";


const storage = multer.diskStorage({}); // Cloudinary uses temp file paths

const fileFilter = (req, file, cb) => {
  // Accept all image/* and video/* MIME types
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "❌ Invalid file type. Only image and video files are allowed!"
      ),
      false
    );
  }
};

// ⚙️ Create the upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  fileFilter,
});

export default upload;


