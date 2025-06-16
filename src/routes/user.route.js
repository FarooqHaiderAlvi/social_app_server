import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  loginUser,
  logOutUser,
  updateAvatar,
  LoggedInUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/get-user").get(verifyJWT, LoggedInUser);

export default router;
