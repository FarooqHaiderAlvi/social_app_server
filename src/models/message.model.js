import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    msgText: {
      type: String,
    },
    msgFile: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
