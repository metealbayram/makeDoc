import { Router } from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../controller/notification.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const notificationRouter = Router();

notificationRouter.get("/", authMiddleware, getMyNotifications);
notificationRouter.patch("/:id/read", authMiddleware, markNotificationAsRead);
notificationRouter.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

export default notificationRouter;