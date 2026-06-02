import User from "../models/User.js";

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File gambar wajib diupload",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${baseUrl}/uploads/profile/${req.file.filename}`;

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