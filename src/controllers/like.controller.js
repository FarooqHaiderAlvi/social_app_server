import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ObjectId } from "mongodb";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { Like } from "../models/like.model.js";

const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.body;
  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }
  // Check if the like already exists
  const existingLike = await Like.findOne({
    postId: new ObjectId(postId),
    likedBy: req.user._id,
  });
  if (existingLike) {
    // If it exists, remove the like
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Like removed successfully"));
  } else {
    console.log("Like not found, creating a new one");
    await Like.create({
      postId: new ObjectId(postId),
      likedBy: req.user._id,
    });
    console.log("in the main function");
    return res.status(201).json(new ApiResponse(201, { isLiked: true }, "Like added successfully"));
  }
});

const isPostLiked = asyncHandler(async (req, res) => {
  const { postId } = req.body;
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
  const { postId } = req.body;
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
