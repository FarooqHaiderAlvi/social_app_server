import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/apiError.util.js";
import { Story } from "../models/story.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";

const createStory = asyncHandler(async (req, res) => {
  const storyPost = req.file?.path;
  if (!storyPost) {
    throw new ApiError(400, "Story Post file is missing.");
  }

  const attachment = await uploadOnCloudinary(storyPost);
  console.log(attachment, "attachment");
  if (!attachment.secure_url) {
    throw new ApiError(400, "Error while uploading on Avatar.");
  }

  const story = await Story.create({
    ownerId: req.user._id,
    storyUrl: attachment.secure_url,
  });

  if (!story) {
    throw new ApiError(500, "Unable to create story.");
  }
  return res.status(201).json(new ApiResponse(201, story, "Post created successfully."));
});

const getStory = asyncHandler(async (req, res) => {
  // const stories = await Story.find().sort({ createdAt: -1 });

  const stories = await Story.aggregate([
    // 1. Lookup user info
    {
      $lookup: {
        from: "users",
        localField: "ownerId",
        foreignField: "_id",
        as: "owner",
      },
    },
    // 2. Unwind the user array (because lookup gives an array)
    { $unwind: "$owner" },

    // 3. Group by owner to build story list
    {
      $group: {
        _id: "$owner._id",
        username: { $first: "$owner.username" },
        avatar: { $first: "$owner.avatar" },
        storyList: {
          $push: {
            _id: "$_id",
            storyUrl: "$storyUrl",
            createdAt: "$createdAt",
            viewerId: "$viewerId",
          },
        },
      },
    },

    // 4. Optional: sort by newest story per user
    { $sort: { "storyList.createdAt": -1 } },
  ]);

  if (!stories) {
    return res.status(200).json(new ApiResponse(200, [], "No Story Found."));
  }
  return res.status(200).json(new ApiResponse(200, stories, "Stories fetched."));
});
export { createStory, getStory };
