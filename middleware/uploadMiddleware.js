import multer from "multer";

// We don’t need local folders anymore because Cloudinary uploads directly from temp file
const storage = multer.diskStorage({});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // optional: limit 50MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"), false);
    }
  },
});

export default upload;


