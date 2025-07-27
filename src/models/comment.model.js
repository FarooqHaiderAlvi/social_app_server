import mongoose, { Schema } from "mongoose";
import { Notification } from "./notification.model.js";
import { Post } from "./post.model.js";
import { User } from "./user.model.js";
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
    const post = await Post.findById(doc.postId);
    if (!post) {
      return next(new Error("Post not found"));
    }

    // Populate both sender and receiver details
    const [sender, receiver] = await Promise.all([
      User.findById(doc.commentedBy),
      User.findById(post.ownerId),
    ]);

    const notification = await Notification.create({
      sender: doc.commentedBy,
      receiver: post.ownerId,
      postId: doc.postId,
      action: "comment",
    });

    // Structure the complete notification object
    doc.$notification = {
      _id: notification._id,
      sender: {
        _id: sender._id,
        username: sender.username,
        avatar:
          sender.avatar ||
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      },
      receiver: {
        _id: receiver._id,
        username: receiver.username,
        avatar:
          receiver.avatar ||
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      },
      postId: doc.postId,
      postUrl: post.postUrl || "https://via.placeholder.com/150/000000/FFFFFF/?text=No+Image",
      action: "comment",
      isRead: false,
      createdAt: notification.createdAt,
    };

    next();
  } catch (err) {
    next(err);
  }
});

export const Comment = mongoose.model("Comment", commentSchema);
