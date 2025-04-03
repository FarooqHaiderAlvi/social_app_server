const asyncHandler = (requestHandler) => {
  console.log("inside async handler", requestHandler);
  return (req, res, next) => {
    console.log("inside async handler function");
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      console.log("inside error handler", error);
      next(error);
    });
  };
};

export { asyncHandler };
