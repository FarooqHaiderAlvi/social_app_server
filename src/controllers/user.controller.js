import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/apiError.util.js";

const hello = asyncHandler(async (req, res) => {
  if (1 == 1) {
    throw new ApiError(400, "This is a custom error", [], "stack trace here");
  }
  return res.status(200).json(new ApiResponse(200, { msg: "Hello World" }));
});

export { hello };
