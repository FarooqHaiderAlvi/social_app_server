import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/createPost").post(verifyJWT, upload.single("attachment"), createPost);

router.route("/userPosts").get(verifyJWT, getUserPosts);
router.route("/userPost/:postId").get(verifyJWT, getPostById);
router.route("/updatePost/:postId").patch(verifyJWT, upload.single("attachment"), updatePost);
router.route("/updatePost/:postId").delete(verifyJWT, deletePost);

export default router;
