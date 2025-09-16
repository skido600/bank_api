import mongoose from "mongoose";
import { MONGODB_URL } from "../util/dotenv.ts";

const connectDb = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("connected to mongodb ", mongoose.connection.name);
  } catch (error) {
    console.log(error);
    throw new Error("issue connecting to db check internet connection");
  }
};

export default connectDb;
