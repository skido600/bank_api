import mongoose, { Schema, Document } from "mongoose";

export interface TransactionDoc extends Document {
  senderAcc: string;
  receiverAcc: string;
  amount: number;
  senderName: string;
  receiverName: string;
  type: "debit" | "credit";
  status: "pending" | "success" | "failed";
  transferId: string;
  userId: mongoose.Types.ObjectId;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}
const transactionSchema = new Schema<TransactionDoc>(
  {
    senderAcc: { type: String, required: true },
    senderName: { type: String, required: true },
    receiverAcc: { type: String, required: true },
    receiverName: { type: String, required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },

    reference: { type: String, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
  },

  { timestamps: true }
);

transactionSchema.index({ senderAcc: 1 });
transactionSchema.index({ receiverAcc: 1 });

const Transaction = mongoose.model<TransactionDoc>(
  "Transaction",
  transactionSchema
);

export default Transaction;
