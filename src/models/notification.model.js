import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    notifyBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notifyTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    action: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
