import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("File harus berupa gambar JPG, PNG, atau WEBP"), false);
  }

  cb(null, true);
};

export const uploadProfile = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});