import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { sendMessage, getConversation, getUnreadMessages } from "../controller/messages.controller.js";

const messagesRouter = Router();

messagesRouter.post("/", authorize, sendMessage);
messagesRouter.get("/unread", authorize, getUnreadMessages);
messagesRouter.get("/:otherUserId", authorize, getConversation);

export default messagesRouter;
