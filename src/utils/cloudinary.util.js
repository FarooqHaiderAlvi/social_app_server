import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  console.log("localFilePath=>", cloudinary.config());

  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("err=>", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (fileUrl, resourceType) => {
  try {
    const publicId = fileUrl.split("/").pop().split(".")[0];

    // Attempt to delete the file from Cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    // Check if the response indicates success
    if (response.result === "ok") {
      console.log("File successfully deleted and invalidated.");
    } else {
      console.log("File deletion response:", response);
    }
  } catch (error) {
    console.log("Error deleting file: =>", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
