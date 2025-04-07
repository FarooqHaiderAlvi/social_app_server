import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.get("/", (req, res) => {
  res.send("Hello World");
});
export default app;
