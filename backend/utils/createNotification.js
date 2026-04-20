import Notification from "../models/notification.js";

export const createNotification = async ({
  user,
  type,
  title,
  message,
  sender = null,
  document = null,
  meta = {}
}) => {
  return await Notification.create({
    user,
    type,
    title,
    message,
    sender,
    document,
    meta
  });
};