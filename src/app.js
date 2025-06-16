import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";
import commentRouter from "./routes/comment.route.js";
import postRouter from "./routes/post.route.js";
import followerRouter from "./routes/follower.route.js";
import likeRouter from "./routes/like.route.js";
import notificationRouter from "./routes/notification.route.js";
import storyRouter from "./routes/story.route.js";
import messageRouter from "./routes/message.route.js";
import cors from "cors";

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN, process.env.CORS_ORIGIN2],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/followers", followerRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/stories", storyRouter);
app.use("/api/v1/messages", messageRouter);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running");
});

export default app;
