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
  const stories = await Story.find({ ownerId: req.user._id }).sort({
    createdAt: -1,
  });
  if (!stories) {
    return res.status(200).json(new ApiResponse(200, [], "No Story Found."));
  }
  return res.status(200).json(new ApiResponse(200, stories, "Stories fetched."));
});
export { createStory, getStory };
