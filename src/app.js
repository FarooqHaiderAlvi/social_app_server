import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";
import commentRouter from "./routes/comment.route.js";
import postRouter from "./routes/post.route.js";
import followerRouter from "./routes/follower.route.js";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/followers", followerRouter);
app.get("/", (req, res) => {
  res.send("Hello World");
});
export default app;
