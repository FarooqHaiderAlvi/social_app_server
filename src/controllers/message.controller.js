import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ObjectId } from "mongodb";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { Message } from "../models/message.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, msgText } = req.body;
  console.log(receiverId, msgText, "receiverId, msgText");
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
  return res.status(201).json(new ApiResponse(201, message, "Message sent successfully."));
});

const getUserMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const messages = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: new ObjectId(userId) }, { receiverId: new ObjectId(userId) }],
      },
    },
    // Lookup for sender
    {
      $lookup: {
        from: "users",
        localField: "senderId",
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
        localField: "receiverId",
        foreignField: "_id",
        as: "receiverDetails",
      },
    },
    {
      $unwind: "$receiverDetails",
    },
    {
      $project: {
        _id: 1,
        senderId: "$senderDetails._id",
        senderName: "$senderDetails.username",
        receiverId: "$receiverDetails._id",
        receiverName: "$receiverDetails.username",
        msgText: 1,
        msgFile: 1,
        createdAt: 1,
      },
    },
  ]).sort({ createdAt: -1 });

  if (!messages) {
    return res.status(200).json(new ApiResponse(200, [], "No messages found."));
  }
  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched."));
});

export { sendMessage, getUserMessages };
