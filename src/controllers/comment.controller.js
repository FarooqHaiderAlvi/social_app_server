import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ObjectId } from "mongodb";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { Post } from "../models/post.model.js";
const getPostComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { postId } = req.params;
  // const { page = 1, limit = 10 } = req.query

  const comments = await Comment.aggregate([
    {
      $match: {
        postId: new ObjectId(`${postId}`), // here i am sending it id as a string if i want to send id as a number now i need to do it like objectId.createFromHexString(videoId)
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentedBy",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        commentedBy: 1,
        "userDetails.username": 1, // Include username from the users collection
        "userDetails.avatar": 1, // Include avatar from the users collection
      },
    },
  ]);

  if (!comments) {
    throw new ApiError(500, "Something went wrong");
  }
  console.log(comments);
  return res.status(200).json(new ApiResponse(200, comments, "comments fetched successfully!"));
});

const createComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { postId } = req.params;
  const { content } = req.body;
  console.log("inside addComment", content);
  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  const comment = await Comment.create({
    text: content,
    postId,
    commentedBy: req.user._id,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong");
  }
  // console.log("inside addComment", comment);
  return res.status(200).json(new ApiResponse(200, comment, "comment added successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.commentedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content: content },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Something went wrong");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "comment updated successfully!"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  console.log(comment.owner, req.user._id);
  if (comment.commentedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Something went wrong");
  }
  console.log(deletedComment);
  return res.status(200).json(new ApiResponse(200, {}, "comment deleted successfully!"));
});

export { getPostComments, createComment, updateComment, deleteComment };
