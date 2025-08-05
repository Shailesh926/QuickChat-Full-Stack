import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";
import { getConversations } from "../controllers/conversationController.js";
const messageRouter = express.Router();

messageRouter.get("/conversations", protectRoute, getConversations);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.post("/send/:id", protectRoute, sendMessage)

export default messageRouter;