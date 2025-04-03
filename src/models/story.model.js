import mongoose, { Schema } from "mongoose";

const storySchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    viewerId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    storyUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Story = mongoose.model("Story", storySchema);
