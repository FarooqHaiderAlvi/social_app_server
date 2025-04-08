import { asyncHandler } from "../utils/asyncHandler.util.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/apiError.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";

const createPost = asyncHandler(async (req, res) => {
  const { description } = req.body;
  if (!description) {
    throw new ApiError(400, "Description is required");
  }
  const attachmentLocalPath = req.file?.path;
  if (!attachmentLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }

  const attachment = await uploadOnCloudinary(attachmentLocalPath);
  console.log(attachment, "attachment");
  if (!attachment.secure_url) {
    throw new ApiError(400, "Error while uploading on Avatar.");
  }

  const post = await Post.create({
    ownerId: req.user._id,
    postUrl: attachment.secure_url,
    description,
  });

  if (!post) {
    throw new ApiError(500, "Unable to create post.");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully."));
});

const getUserPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ ownerId: req.user._id }).sort({
    createdAt: -1,
  });
  if (!posts) {
    return res.status(200).json(new ApiResponse(200, [], "No Post Found."));
  }
  return res.status(200).json(new ApiResponse(200, posts, "Posts fetched."));
});

const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId).populate("ownerId", "-password"); //using mongoose populate to get the user details
  if (!post) {
    throw new ApiError(404, "Post not found.");
  }
  return res.status(200).json(new ApiResponse(200, post, "Post fetched."));
});

export { createPost, getUserPosts, getPostById };
