import mongoose, { Schema } from "mongoose";

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

export const Like = mongoose.model("Like", likeSchema);
