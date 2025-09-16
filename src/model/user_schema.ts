import mongoose, { Schema, Model } from "mongoose";
import type { AuthUser } from "../type/types.ts";

const userSchema = new Schema(
  {
    full_name: {
      type: String,
      trim: true,
      required: true,
    },
    phonenumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      select: false,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: [true, "Email must be unique"],
      minlength: [5, "Email must have 5 characters"],
      lowercase: true,
    },
    address: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    verificationCode: {
      type: String,
      required: false,
    },
    verificationCodeExpires: { type: Date, required: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
const Auth = mongoose.model<AuthUser>("Auth", userSchema);

export default Auth;
