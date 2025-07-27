import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ObjectId } from "mongodb";
import { ApiResponse } from "../utils/apiResponse.util.js";
import mongoose from "mongoose";
import { Notification } from "../models/notification.model.js";

const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch notifications for the user
  const notifications = await Notification.aggregate([
    {
      $match: {
        $or: [
          { receiver: new mongoose.Types.ObjectId(userId) },
          { sender: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    // Lookup for sender
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "senderDetails",
      },
    },
    {
      $unwind: "$senderDetails",
    },
    // Lookup for receiver
    {
      $lookup: {
        from: "users",
        localField: "receiver",
        foreignField: "_id",
        as: "receiverDetails",
      },
    },
    {
      $unwind: "$receiverDetails",
    },
    // Lookup for post details
    {
      $lookup: {
        from: "posts",
        localField: "postId",
        foreignField: "_id",
        as: "postDetails",
      },
    },
    {
      $unwind: {
        path: "$postDetails",
        preserveNullAndEmptyArrays: true, // In case post is deleted
      },
    },
    {
      $project: {
        _id: 1,
        sender: {
          _id: "$senderDetails._id",
          username: "$senderDetails.username",
          avatar: "$senderDetails.avatar",
        },
        receiver: {
          _id: "$receiverDetails._id",
          username: "$receiverDetails.username",
          avatar: "$receiverDetails.avatar",
        },
        postId: 1,
        postUrl: "$postDetails.postUrl", // Add post URL from post details
        action: 1,
        isRead: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

export { getUserNotifications };
