import { Router } from "express";
import {
  createComment,
  updateComment,
  deleteComment,
  getPostComments,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/create-comment/:postId").post(verifyJWT, createComment);
router.route("/get-comments/:postId").get(verifyJWT, getPostComments);
router.route("/update-comment/:commentId").patch(verifyJWT, updateComment);
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

export default router;
