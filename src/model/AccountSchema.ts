import mongoose, { Schema, Document } from "mongoose";

export interface AccountDoc extends Document {
  userId: mongoose.Types.ObjectId;
  accountNumber: string;
  accountName: string;
  balance: number;
  Email: string;
}

const bankSchema = new Schema<AccountDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    accountNumber: {
      type: String,
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    accountName: {
      type: String,
      unique: true,
      required: true,
    },
    Email: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

const Account = mongoose.model<AccountDoc>("Account", bankSchema);
export default Account;
