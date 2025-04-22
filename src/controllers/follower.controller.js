import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { Follower } from "../models/follower.model.js";
import mongoose from "mongoose";

const addFollower = asyncHandler(async (req, res) => {
  const { followingId } = req.body;

  // 1. Validate input
  if (!followingId) {
    throw new ApiError(400, "Following ID is required");
  }

  // 2. Check if user is trying to follow themselves
  if (req.user._id.toString() === followingId) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  // 3. Check if follow relationship already exists
  const existingFollow = await Follower.findOne({
    followerId: req.user._id,
    followingId: new mongoose.Types.ObjectId(followingId),
  });

  if (existingFollow) {
    throw new ApiError(400, "You are already following this user");
  }

  // 4. Create new follow relationship
  const newFollower = await Follower.create({
    followerId: req.user._id,
    followingId: new mongoose.Types.ObjectId(followingId),
  });

  if (!newFollower) {
    throw new ApiError(500, "Failed to create follow relationship");
  }

  return res.status(201).json(new ApiResponse(201, newFollower, "Followed successfully"));
});

const removeFollower = asyncHandler(async (req, res) => {
  const { followingId } = req.body;

  // 1. Validate input
  if (!followingId) {
    throw new ApiError(400, "Following ID is required");
  }

  // 2. Check if follow relationship exists
  const existingFollow = await Follower.findOneAndDelete({
    followerId: req.user._id,
    followingId: new mongoose.Types.ObjectId(followingId),
  });
  console.log("unfollow", existingFollow);

  if (!existingFollow) {
    throw new ApiError(400, "You are not following this user");
  }

  return res.status(200).json(new ApiResponse(200, null, "Unfollowed successfully"));
});

const getFollowStats = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  const followers = await Follower.countDocuments({
    followingId: userId,
  });
  const following = await Follower.countDocuments({
    followerId: userId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { followerCount: followers, followingCount: following },
        "Follow stats fetched successfully"
      )
    );
});

const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  const followers = await Follower.aggregate([
    {
      $match: { followingId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "followerId",
        foreignField: "_id",
        as: "followersList",
      },
    },
    {
      $unwind: {
        path: "$followersList",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        followerId: "$followerId",
        followerUserName: "$followersList.username",
        followerAvatar: "$followersList.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { userFollowers: followers }, "Followers fetched successfully"));
});

const getFollowings = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  const followings = await Follower.aggregate([
    {
      $match: { followerId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "followingId",
        foreignField: "_id",
        as: "followingList",
      },
    },
    {
      $unwind: {
        path: "$followingList",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        followingId: "$followingId",
        followeingUserName: "$followingList.username",
        followingAvatar: "$followingList.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { userFollowings: followings }, "Followers fetched successfully"));
});

export { addFollower, removeFollower, getFollowStats, getFollowers, getFollowings };
