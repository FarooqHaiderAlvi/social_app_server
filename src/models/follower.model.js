import mongoose, { Schema } from "mongoose";

const FollowerSchema = new Schema(
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

export const Follower = mongoose.model("Follower", FollowerSchema);
