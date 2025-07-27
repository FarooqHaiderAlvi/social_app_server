import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ObjectId } from "mongodb";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { Like } from "../models/like.model.js";
import { getIO } from "../utils/socket.util.js";
import { Post } from "../models/post.model.js";

const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const postObjectId = new ObjectId(postId);
  const userId = req.user._id;

  // Check if like already exists
  const existingLike = await Like.findOne({ postId: postObjectId, likedBy: userId });

  let like;
  let likeDoc = "";
  let isLiked = false;
  if (existingLike) {
    // Unlike the post
    await Like.deleteOne({ _id: existingLike._id });
    isLiked = false;
  } else {
    // Like the post
    like = await Like.create({ postId: postObjectId, likedBy: userId });
    isLiked = true;
  }

  const post = await Post.findOne({
    _id: new ObjectId(postId),
  }).select("ownerId");
  const receiverId = post.ownerId;
  const { io, onlineUsers } = getIO();

  const tempSenderSocket = onlineUsers.get(req.user._id.toString());
  const tempReceiverSocket = onlineUsers.get(receiverId?.toString());
  // Debug room membership
  // console.log("[Socket.IO] Online users:", onlineUsers.size);
  for (const [key, value] of onlineUsers) {
    console.log(`Key: ${key}, Value: ${value}`);
  }
  const senderSockets = await io.in(tempSenderSocket).fetchSockets();
  const receiverSockets = await io.in(tempReceiverSocket).fetchSockets();

  console.log(`[Socket.IO] Room members:
    - Sender room sockets: ${senderSockets.length}
    - Receiver room sockets: ${receiverSockets.length}`);

  // Emit to receiver
  if (like?.$notification) {
    console.log("sending notification", receiverId, req.user._id);
    console.log("likenotification", like.$notification);
    io.to(tempReceiverSocket).emit("new-notification", {
      eventType: "new-notification",
      sender: receiverId,
      notification: like?.$notification,
    });

    // Emit to sender (for their own UI update)
    io.to(tempSenderSocket).emit("new-notification", {
      eventType: "new-notification",
      sender: req.user._id,
      notification: like?.$notification,
    });
  }

  // Get updated total likes count
  const totalLikes = await Like.countDocuments({ postId: postObjectId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked,
        likeCount: totalLikes,
      },
      isLiked ? "Like added successfully" : "Like removed successfully"
    )
  );
});

// Check if current log in user has liked this post
const isPostLiked = asyncHandler(async (req, res) => {
  const { postId } = req.query;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  // Check if the like exists
  const existingLike = await Like.findOne({
    postId: new ObjectId(postId),
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: !!existingLike }, "Like status fetched successfully"));
});

const totalLikes = asyncHandler(async (req, res) => {
  const { postId } = req.query;
  console.log("postid", postId);
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  // Count the number of likes for the post
  const likeCount = await Like.countDocuments({ postId: new ObjectId(postId) });

  return res
    .status(200)
    .json(new ApiResponse(200, { likeCount }, "Like count fetched successfully"));
});

const getUsersWhoLikedPost = asyncHandler(async (req, res) => {
  const { postId } = req.body;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  // Find all users who liked the post
  const likes = await Like.aggregate([
    {
      $match: { postId: new ObjectId(postId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedByUser",
      },
    },
    {
      $unwind: "$likedByUser",
    },
    {
      $project: {
        _id: 0,
        likedByUserId: "$likedByUser._id",
        likedByUserName: "$likedByUser.username",
        likedByUserAvatar: "$likedByUser.avatar",
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, likes, "Users who liked the post fetched"));
});

export { toggleLike, isPostLiked, totalLikes, getUsersWhoLikedPost };
