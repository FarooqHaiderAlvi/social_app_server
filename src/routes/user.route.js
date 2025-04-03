import { Router } from "express";
import { hello } from "../controllers/user.controller.js";
const router = Router();

router.route("/hello").get(hello);

export default router;
