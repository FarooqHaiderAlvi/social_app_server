import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/apiError.util.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, fullName, password, username } = req.body;
  console.log("isnide registerUser");
  if ([email, fullName, password, username].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(400, "User with this email or username already exists.");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
  });

  const tokens = await generateTokens(user._id);
  if (!tokens) {
    throw new ApiError(500, "Unable to generate tokens...");
  }
  console.log(tokens);
  console.log("user is created");

  res.cookie("access_token", tokens.accessToken, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 5 * 60 * 60 * 1000,
    path: "/",
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    path: "/",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { tokens, id: user._id }, "User created Successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "Username or email is required.");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  const isValidPass = await user.isPasswordCorrect(password);
  if (!isValidPass) {
    throw new ApiError(400, "Invalid credentials.");
  }

  const tokens = await generateTokens(user._id);
  if (!tokens) {
    throw new ApiError(500, "Unable to generate tokens...");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("access_token", tokens.accessToken, options)
    .cookie("refresh_token", tokens.refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: { id: user._id, email: user.email } },
        "User LoggedIn Successfully!"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  console.log("i have reached here in debugging.");
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("access_token", options)
    .clearCookie("refresh_token", options)
    .json(new ApiResponse(200, {}, "User logged Out."));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    return new ApiError(400, "Avatar file is missing.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    return new ApiResponse(400, "Error while uploading on Avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true } //  «Boolean» if true, return the modified document rather than the original
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "User Avatar updated successfully."));
});

export { registerUser, loginUser, logOutUser, updateAvatar };
