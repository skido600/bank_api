import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  signup as signupValidator,
  login as loginValidate,
} from "../validator/validator.ts";
import type { inputbody, ResetPasswordBody } from "../type/types.ts";
import { HandleResponse } from "../config/HandleResponse.ts";
import Auth from "../model/user_schema.ts";
import argon2 from "argon2";
import { hmacProcess } from "../config/hashcode.ts";
import { HMAC_VERIFICATION_CODE_SECRET, JWT_SEC } from "../util/dotenv.ts";
import Otpcode from "../config/generateotp.ts";
import sendMail from "../config/sendemailotp.ts";
import createBankAccount from "../model/Createbankaaccount.ts";
import { resetPasswordSchema } from "../validator/resetPasswordSchema.ts";

const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      full_name,
      phonenumber,
      email,
      password,
      confirmPassword,
      address,
    }: inputbody = req.body;
    const { error } = signupValidator.validate({
      full_name,
      phonenumber,
      email,
      password,
      address,
    });
    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    if (password !== confirmPassword) {
      return HandleResponse(res, false, 400, "Passwords do not match");
    }
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return HandleResponse(
        res,
        false,
        400,
        "User with this email already exists"
      );
    }
    const hashedPassword = await argon2.hash(password);
    const verificationCode = Otpcode();
    const hashCodeValue = hmacProcess(
      verificationCode,
      HMAC_VERIFICATION_CODE_SECRET
    );

    const newUser = new Auth({
      full_name,
      phonenumber,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode: hashCodeValue,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
    });
    await newUser.save();

    await createBankAccount(
      newUser._id.toString(),
      phonenumber,
      full_name,
      email
    );
    try {
      await sendMail(email, verificationCode);
    } catch (mailError) {
      console.error("OTP email failed:", mailError);
      return HandleResponse(
        res,
        true,
        201,
        "User registered successfully, but failed to send verification email. Please try resending OTP.",
        {
          email: newUser.email,
          isVerified: newUser.isVerified,
        }
      );
    }
    return HandleResponse(
      res,
      true,
      201,
      "User registered successfully. Please check your email for the verification code, The verification code will expire in 15mins",
      {
        email: newUser.email,
        isVerified: newUser.isVerified,
      }
    );
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return HandleResponse(
        res,
        false,
        400,
        `A user with this ${field} already exists.`
      );
    }

    console.error(error);
    next(error);
  }
};

//email otp
const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;

    const user = await Auth.findOne({ email });
    if (!user) return HandleResponse(res, false, 404, "User not found");

    if (user.isVerified) {
      return HandleResponse(res, false, 400, "Email already verified");
    }

    if (
      !user.verificationCodeExpires ||
      user.verificationCodeExpires.getTime() < Date.now()
    ) {
      return HandleResponse(
        res,
        false,
        400,
        "Token has expired. Please request a new code."
      );
    }
    const hashedCode = hmacProcess(code, HMAC_VERIFICATION_CODE_SECRET);
    if (user.verificationCode !== hashedCode) {
      return HandleResponse(res, false, 400, "Invalid token");
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    return HandleResponse(res, true, 200, "Email verified successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      next(error);
    }
  }
};
//resend otp
const resendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await Auth.findOne({ email });
    if (!user) return HandleResponse(res, false, 404, "User not found");
    if (user.isVerified)
      return HandleResponse(res, false, 400, "Email already verified");

    const verificationCode = Otpcode();
    const hashedCode = hmacProcess(
      verificationCode,
      HMAC_VERIFICATION_CODE_SECRET
    );

    user.verificationCode = hashedCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email
    await sendMail(email, verificationCode);

    HandleResponse(res, true, 200, "New verification code sent to your email.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      next(error);
    }
  }
};
const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email_phonenumber, password } = req.body;
    const { error } = loginValidate.validate({
      email_phonenumber,
      password,
    });
    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    const user = await Auth.findOne({
      $or: [{ email: email_phonenumber }, { phonenumber: email_phonenumber }],
    }).select("+password");

    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }
    if (!user.isVerified) {
      return HandleResponse(
        res,
        false,
        400,
        "please verify your email before logging if otp expire regenerate another"
      );
    }
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      return HandleResponse(res, false, 400, "Incorrect password");
    }
    // await updateAllUsersToManager();
    const token = jwt.sign(
      {
        isManeger: user.isManeger,
        userid: user._id,
        number: user.phonenumber,
        isverify: user.isVerified,
        email: user.email,
        full_name: user.full_name,
        accountNumber: user.accountNumber,
      },
      JWT_SEC,
      { expiresIn: "8h" }
    );

    console.log(user);

    return HandleResponse(res, true, 200, "Login successful", {
      token: token,
      isManeger: user.isManeger,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      next(error);
    }
  }
};
// async function updateAllUsersToManager() {
//   try {
//     const result = await Auth.updateMany({}, { $set: { isManeger: false } });
//     console.log("Update result:", result);
//   } catch (err) {
//     console.error("Error updating users:", err);
//   }
// }
const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await Auth.findOne({ email });
    if (!user) return HandleResponse(res, false, 404, "User not found");

    const verificationCode = Otpcode();
    const hashedCode = hmacProcess(
      verificationCode,
      HMAC_VERIFICATION_CODE_SECRET
    );

    user.verificationCode = hashedCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendMail(email, verificationCode);

    return HandleResponse(
      res,
      true,
      200,
      "Password reset code sent to your email."
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      next(error);
    }
  }
};

// reset password
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code, newPassword, confirmPassword } =
      req.body as ResetPasswordBody;
    const { error } = resetPasswordSchema.validate({
      email,
      code,
      newPassword,
      confirmPassword,
    });
    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    const user = await Auth.findOne({ email }).select("+password");
    if (!user) return HandleResponse(res, false, 404, "User not found");

    if (
      !user.verificationCodeExpires ||
      user.verificationCodeExpires.getTime() < Date.now()
    ) {
      return HandleResponse(res, false, 400, "Reset code has expired.");
    }

    const hashedCode = hmacProcess(code, HMAC_VERIFICATION_CODE_SECRET);
    if (user.verificationCode !== hashedCode) {
      return HandleResponse(res, false, 400, "Invalid reset code.");
    }

    if (newPassword !== confirmPassword) {
      return HandleResponse(res, false, 400, "Passwords do not match.");
    }

    const hashedPassword = await argon2.hash(newPassword);

    user.password = hashedPassword;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    return HandleResponse(res, true, 200, "Password reset successful.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      next(error);
    }
  }
};
export default {
  signup,
  verifyEmail,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
};
