import multer from "multer";
import path from "path";
import fs from "fs";

const profileUploadPath = "uploads/profile";

if (!fs.existsSync(profileUploadPath)) {
  fs.mkdirSync(profileUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("File harus berupa gambar JPG, PNG, atau WEBP"), false);
  }

  cb(null, true);
};

export const uploadProfile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});