import mongoose, { Schema } from "mongoose";
import { getIO } from "../utils/socket.util.js";
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
    expireAfterSeconds: 24 * 60 * 60, //86400s story for one day,
    name: "story_ttl_index",
  }
);

// Middleware to update updatedAt manually
storySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Story = mongoose.model("Story", storySchema);

export const watchStories = () => {
  let storyChangeStream = Story.watch();
  const { io } = getIO();

  const startWatch = () => {
    storyChangeStream.on("change", (change) => {
      console.log("Story change detected:", change);
      io.emit("story-changed", change);
    });

    storyChangeStream.on("error", (err) => {
      console.error("Story ChangeStream error:", err);

      // Close the old stream
      storyChangeStream.close();

      // Restart the stream after a short delay
      setTimeout(() => {
        console.log("Restarting Story ChangeStream...");
        storyChangeStream = Story.watch();
        startWatch(); // reattach listeners
      }, 5000);
    });
  };

  startWatch();
};
