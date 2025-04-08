import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  getUserPosts,
  getPostById,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router
  .route("/createPost")
  .post(verifyJWT, upload.single("attachment"), createPost);

router.route("/userPosts").get(verifyJWT, getUserPosts);
router.route("/userPost/:postId").get(verifyJWT, getPostById);

export default router;
