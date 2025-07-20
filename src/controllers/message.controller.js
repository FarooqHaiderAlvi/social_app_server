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
    console.log("got you file");
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

  // Enhanced Socket.IO emission with debugging
  try {
    const { io, onlineUsers } = getIO();
    const senderRoom = req.user._id.toString();
    const receiverRoom = receiverId.toString();

    console.log(`[Socket.IO] Emitting to rooms:
    - Sender: ${senderRoom}
    - Receiver: ${receiverRoom}
    - Message ID: ${onlineUsers.get(req.user._id.toString())}`);
    const tempSenderSocket = onlineUsers.get(req.user._id.toString());
    const tempReceiverSocket = onlineUsers.get(receiverId.toString());
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
    io.to(tempReceiverSocket).emit("new-message", {
      eventType: "new-message",
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

    // Emit to sender (for their own UI update)
    io.to(tempSenderSocket).emit("new-message", {
      eventType: "new-message",
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

    console.log("[Socket.IO] Emission complete for message:", message._id);
  } catch (error) {
    console.error("[Socket.IO] Emission failed:", error);
    // Continue with the response even if socket fails
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
    // { $sort: { createdAt: 1 } },
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

const getAllUserChatMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await User.aggregate([
    // 1. Exclude current logged-in user
    {
      $match: {
        _id: { $ne: new ObjectId(userId) },
      },
    },

    // 2. Lookup last message between current user and this user
    {
      $lookup: {
        from: "messages",
        let: { otherUserId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$senderId", new ObjectId(userId)] },
                          { $eq: ["$receiverId", "$$otherUserId"] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ["$receiverId", new ObjectId(userId)] },
                          { $eq: ["$senderId", "$$otherUserId"] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastMessage",
      },
    },

    // 3. Flatten lastMessage array
    {
      $unwind: {
        path: "$lastMessage",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 4. Final projection
    {
      $project: {
        userId: "$_id",
        username: 1,
        avatar: 1,
        messageId: "$lastMessage._id",
        msgText: "$lastMessage.msgText",
        createdAt: "$lastMessage.createdAt",
        msgFile: {
          $cond: [
            { $isArray: "$lastMessage.msgFile" },
            {
              $map: {
                input: "$lastMessage.msgFile",
                as: "file",
                in: {
                  url: "$$file.url",
                  type: "$$file.type",
                },
              },
            },
            [],
          ],
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, result || [], "Messages fetched successfully."));
});

export { sendMessage, getUserMessages, getUsers, getAllUserChatMessages };
