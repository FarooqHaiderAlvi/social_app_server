import { asyncHandler } from "../utils/asyncHandler.util.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/apiError.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.util.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
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
  return res.status(201).json(new ApiResponse(201, post, "Post created successfully."));
});

const getAllUsersPosts = asyncHandler(async (req, res) => {
  const posts = await Post.aggregate([
    // Sort by newest first
    { $sort: { createdAt: -1 } },

    // Lookup owner details
    {
      $lookup: {
        from: "users",
        localField: "ownerId",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { _id: 1, username: 1, avatar: 1 } }],
      },
    },

    // Convert owner array to object (since lookup returns an array)
    { $unwind: "$owner" },

    // Lookup comments (just for counting)
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "postId",
        as: "comments",
        pipeline: [{ $count: "count" }],
      },
    },

    // Convert comments count
    {
      $addFields: {
        commentsCount: {
          $ifNull: [{ $arrayElemAt: ["$comments.count", 0] }, 0],
        },
      },
    },

    // Lookup likes (just for counting)
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "postId",
        as: "likes",
      },
    },

    // Add fields for counts and clean up structure
    {
      $addFields: {
        totalLikes: { $size: "$likes" },
      },
    },

    // Remove unnecessary arrays
    {
      $project: {
        comments: 0,
        likes: 0,
      },
    },
  ]);

  if (!posts || posts.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No Post Found."));
  }

  return res.status(200).json(new ApiResponse(200, posts, "Posts fetched with details."));
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

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { description } = req.body;

  console.log("iamavatar", description, postId);

  const attachmentLocalPath = req.file?.path;
  if (!description && !attachmentLocalPath) {
    throw new ApiError(400, "Description or file is required.");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found.");
  }
  if (post.ownerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this post.");
  }

  if (attachmentLocalPath) {
    const newPost = await uploadOnCloudinary(attachmentLocalPath);
    if (!newPost.secure_url) {
      throw new ApiError(400, "Error while uploading on Avatar.");
    } else {
      const oldPost = post.postUrl;
      post.postUrl = newPost.secure_url;
      await deleteFromCloudinary(oldPost);
    }
  }

  if (description) {
    post.description = description;
  }

  await post
    .save()
    .then((post) => {
      console.log(post, "post");
      return res.status(200).json(new ApiResponse(200, { post }, "Post updated."));
    })
    .catch((e) => {
      throw new ApiError(500, "Unable to update post.");
    });
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  if (post.ownerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post.");
  }

  const postUrl = post.postUrl;
  const deleteResult = await post.deleteOne(); //using mongoose and deleteOne returns {deletedCount: 1,acknowledged:true} }
  console.log(deleteResult, "deleteResult");
  if (!deleteResult) {
    throw new ApiError(500, "Unable to delete post.");
  }
  await deleteFromCloudinary(postUrl);

  return res.status(200).json(new ApiResponse(200, { deleteResult }, "Post deleted."));
});

export { createPost, getUserPosts, getPostById, updatePost, deletePost, getAllUsersPosts };
