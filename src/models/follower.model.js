import mongoose, { Schema } from "mongoose";
import { Notification } from "./notification.model.js";
const followerSchema = new Schema(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

followerSchema.post("save", async function (doc, next) {
  try {
    console.log("follwer saved hook:");

    // const post = await Post.findById(doc.postId);
    // if (!post) {
    //   return next(new Error("Post not found"));
    // }

    const notification = new Notification({
      sender: doc.followerId,
      receiver: doc.followingId,
      action: "follow",
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

export const Follower = mongoose.model("Follower", followerSchema);
