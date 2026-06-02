import Notification from "../models/Notification.js";

const createNotification = async ({
  userId,
  title,
  message,
  type = "system",
}) => {
  try {
    if (!userId || !title || !message) return null;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
    });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error.message);
    return null;
  }
};

export default createNotification;