import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUsersWhoLikedPost,
  isPostLiked,
  toggleLike,
  totalLikes,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle-like").post(verifyJWT, toggleLike);
router.route("/has-user-liked").get(verifyJWT, isPostLiked);
router.route("/total-likes").get(verifyJWT, totalLikes);
router.route("/user-liked-post").get(verifyJWT, getUsersWhoLikedPost);

export default router;
