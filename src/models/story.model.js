import mongoose, { Schema } from "mongoose";

const storySchema = new Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index on manually defined createdAt
storySchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 120, // 2 minutes for testing
    name: "story_ttl_index",
  }
);

// Middleware to update updatedAt manually
storySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Story = mongoose.model("Story", storySchema);
