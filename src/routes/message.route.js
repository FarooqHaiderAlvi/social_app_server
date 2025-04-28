import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserMessages, sendMessage } from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/send-message").post(verifyJWT, upload.single("attachment"), sendMessage);
router.route("/user-messages").get(verifyJWT, getUserMessages);

export default router;
