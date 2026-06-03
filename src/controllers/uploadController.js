import User from "../models/User.js";
import supabase from "../config/supabase.js";

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File gambar wajib diupload",
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Format gambar harus JPG, PNG, atau WEBP",
      });
    }

    const ext = req.file.originalname.split(".").pop();
    const fileName = `${req.user._id}-${Date.now()}.${ext}`;
    const filePath = `profile/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res.status(400).json({
        message: "Gagal upload foto ke Supabase",
        error: uploadError.message,
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    const photoUrl = publicUrlData.publicUrl;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { photoUrl },
      { new: true }
    ).select("-password");

    res.json({
      message: "Foto profile berhasil diupload",
      photoUrl,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};