import mongoose, { Schema } from "mongoose";
import { Notification } from "./notification.model.js";
import { Post } from "./post.model.js";
const commentSchema = new Schema(
  {
    commentedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

commentSchema.post("save", async function (doc, next) {
  try {
    console.log("comment saved hook:");

    const post = await Post.findById(doc.postId);
    if (!post) {
      return next(new Error("Post not found"));
    }

    const notification = new Notification({
      sender: doc.commentedBy,
      receiver: post.ownerId,
      postId: doc.postId,
      action: "comment",
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

export const Comment = mongoose.model("Comment", commentSchema);
