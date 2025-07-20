import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUserMessages,
  sendMessage,
  getUsers,
  getAllUserChatMessages,
} from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/send-message").post(verifyJWT, upload.single("attachment"), sendMessage);
router.route("/user-messages").post(verifyJWT, getUserMessages);
router.route("/get-users").get(verifyJWT, getUsers);
router.route("/all-user-chat-messages").get(verifyJWT, getAllUserChatMessages);

export default router;
