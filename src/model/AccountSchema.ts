import mongoose, { Schema, Document } from "mongoose";

export interface AccountDoc extends Document {
  userId: mongoose.Types.ObjectId; 
  accountNumber: string;
  balance: number;
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
  },
  { timestamps: true }
);


bankSchema.index({ accountNumber: 1 });

const Account = mongoose.model<AccountDoc>("Account", bankSchema);
export default Account;
