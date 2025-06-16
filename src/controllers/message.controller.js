import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ObjectId } from "mongodb";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { Message } from "../models/message.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
import { User } from "../models/user.model.js";
import { getIO } from "../utils/socket.util.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, msgText } = req.body;

  if (!receiverId) {
    throw new ApiError(400, "Receiver ID is required.");
  }

  const attachmentLocalPath = req.file?.path;
  if (!attachmentLocalPath && !msgText) {
    throw new ApiError(400, "Text message or attachment file is missing.");
  }

  let attachment = null;
  if (attachmentLocalPath) {
    attachment = await uploadOnCloudinary(attachmentLocalPath);
  }

  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    msgText: msgText || "",
    msgFile: attachment?.secure_url || "",
  });

  if (!message) {
    throw new ApiError(500, "Unable to send message.");
  }

  // Emit socket event
  try {
    const io = getIO();
    io.to(receiverId.toString()).emit("new-message", {
      sender: req.user._id,
      message: {
        _id: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        msgText: message.msgText,
        msgFile: message.msgFile,
        createdAt: message.createdAt,
      },
    });
    io.to(req.user._id.toString()).emit("new-message", {
      sender: receiverId,
      message: {
        _id: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        msgText: message.msgText,
        msgFile: message.msgFile,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error("Socket emit error:", error);
  }

  return res.status(201).json(new ApiResponse(201, message, "Message sent successfully."));
});

const getUserMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { chatPartnerId } = req.body;

  if (!chatPartnerId) {
    throw new ApiError(400, "Chat partner ID is required.");
  }

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          {
            senderId: new ObjectId(userId),
            receiverId: new ObjectId(chatPartnerId),
          },
          {
            senderId: new ObjectId(chatPartnerId),
            receiverId: new ObjectId(userId),
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "senderId",
        foreignField: "_id",
        as: "senderDetails",
      },
    },
    { $unwind: "$senderDetails" },
    {
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiverDetails",
      },
    },
    { $unwind: "$receiverDetails" },
    {
      $project: {
        _id: 1,
        senderId: "$senderDetails._id",
        senderName: "$senderDetails.username",
        senderAvatar: "$senderDetails.avatar",
        receiverId: "$receiverDetails._id",
        receiverName: "$receiverDetails.username",
        receiverAvatar: "$receiverDetails.avatar",
        msgText: 1,
        msgFile: 1,
        createdAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, messages || [], "Messages fetched successfully."));
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select(
    "-password -refreshToken -email -createdAt -updatedAt -__v"
  );

  return res.status(200).json(new ApiResponse(200, users || [], "Users fetched successfully."));
});

export { sendMessage, getUserMessages, getUsers };
