import express from "express";
import { uploadProfilePhoto } from "../controllers/uploadController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/profile",
  protect,
  uploadProfile.single("photo"),
  uploadProfilePhoto
);

export default router;