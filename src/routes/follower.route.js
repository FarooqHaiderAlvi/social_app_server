import { Router } from "express";
import {
  addFollower,
  getFollowers,
  getFollowings,
  getFollowStats,
  removeFollower,
} from "../controllers/follower.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/add-follower").post(verifyJWT, addFollower);
router.route("/remove-follower").delete(verifyJWT, removeFollower);
router.route("/get-follow-stats").get(verifyJWT, getFollowStats);
router.route("/get-followers").get(verifyJWT, getFollowers);
router.route("/get-followings").get(verifyJWT, getFollowings);

export default router;
