import Notification from "../models/notification.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({ user: userId })
      .populate("sender", "name email profileImage")
      .populate("document", "title name")
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      const error = new Error("Notification not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    next(error);
  }
};