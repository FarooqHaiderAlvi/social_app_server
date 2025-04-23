import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createStory, getStory } from "../controllers/story.controller.js";
const router = Router();

router.route("/create-story").post(verifyJWT, upload.single("myStory"), createStory);
router.route("/get-story").get(verifyJWT, getStory);

export default router;
