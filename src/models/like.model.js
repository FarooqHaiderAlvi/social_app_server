import mongoose, { Schema } from "mongoose";
import { Notification } from "./notification.model.js";
import { Post } from "./post.model.js";
const likeSchema = new Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: "Post",
    },
  },
  { timestamps: true }
);

likeSchema.post("save", async function (doc, next) {
  try {
    console.log("Like saved hook:");

    const post = await Post.findById(doc.postId);
    if (!post) {
      return next(new Error("Post not found"));
    }

    const existingNotification = await Notification.findOne({
      sender: doc.likedBy,
      receiver: post.ownerId,
      postId: doc.postId,
      action: "like",
    });

    if (existingNotification) {
      console.log("Duplicate like notification found. Skipping creation.");
      return next();
    }
    const notification = new Notification({
      sender: doc.likedBy,
      receiver: post.ownerId,
      postId: doc.postId,
      action: "like",
    });

    await notification.save();

    if (notification) {
      console.log("Notification saved successfully:", notification);
    }

    next();
  } catch (err) {
    next(err);
  }
});

export const Like = mongoose.model("Like", likeSchema);
