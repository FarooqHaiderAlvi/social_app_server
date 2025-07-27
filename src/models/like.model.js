import mongoose, { Schema } from "mongoose";
import { Notification } from "./notification.model.js";
import { Post } from "./post.model.js";
import { User } from "./user.model.js";
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

    const [sender, receiver] = await Promise.all([
      User.findById(doc.likedBy),
      User.findById(post.ownerId),
    ]);
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
      action: "like",
      isRead: false,
      createdAt: notification.createdAt,
    };

    next();
  } catch (err) {
    next(err);
  }
});

export const Like = mongoose.model("Like", likeSchema);
