import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME || "social_app"}`
    );
    console.log(`Connected to MongoDB ConnectionInstance:: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Mongodb connection error ", error);
  }
};

export default connectDB;
