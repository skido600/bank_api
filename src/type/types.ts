import mongoose from "mongoose";
import { Types } from "mongoose";
import type { Response } from "express";
export interface AuthUser extends mongoose.Document {
  _id: Types.ObjectId;
  full_name: string;
  phonenumber: string;
  accountNumber: string;
  accountName: string;
  isManeger: boolean;
  email: string;
  password: string;
  address: string;
  isVerified: boolean;
  verificationCode?: string | null;
  verificationCodeExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type inputbody = {
  full_name: string;
  email: string;
  phonenumber: string;
  password: string;
  confirmPassword: string;
  address: string;
};

export type HandleResponseType<T = unknown> = (
  res: Response,
  success: boolean,
  statuscode: number,
  message: string,
  data?: T | null
) => void;

export type TransferBody = {
  receiverAcc: string;
  amount: number;
};
export type userWithdrawalBody = {
  amount: number;
};
export type ElectricityBody = {
  meterNumber: string;
  amount: number;
};

export interface ResetPasswordBody {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}
