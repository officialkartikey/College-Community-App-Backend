import multer from "multer";
import fs from "fs";
import path from "path";


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "";

    if (file.mimetype.startsWith("image")) {
      folder = "uploads/images";
    } else if (file.mimetype.startsWith("video")) {
      folder = "uploads/videos";
    } else {
      folder = "uploads/others";
    }

    
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;

