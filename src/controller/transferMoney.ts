import type { Request, Response, NextFunction } from "express";
import { transferSchema } from "../validator/transferSchem.ts";
import { HandleResponse } from "../config/HandleResponse.ts";
import mongoose from "mongoose";
import Account from "../model/AccountSchema.ts";
import Transaction from "../model/transactionSchema.ts";
import cron from "node-cron";

interface TransferBody {
  receiverAcc: string;
  amount: number;
}

interface AuthRequest extends Request {
  user?: { userid: string };
}

// Cron job to credit all users every 3 days
export const creditAllUsers = async (): Promise<void> => {
  try {
    const allAccounts = await Account.find();
    for (const account of allAccounts) {
      account.balance += 1000;
      await account.save();
    }
    console.log("All users credited successfully!");
  } catch (error) {
    console.error("Error crediting users:", error);
  }
};

cron.schedule("0 0 */3 * *", async () => {
  console.log("Running cron job: crediting users...");
  await creditAllUsers();
});

// --- Transfer Money ---
export const transferMoney = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { receiverAcc, amount } = req.body as TransferBody;

    // Validate input
    const { error } = transferSchema.validate({ receiverAcc, amount });
    if (error) {
      await session.abortTransaction();
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }

    if (!req.user) {
      await session.abortTransaction();
      return HandleResponse(res, false, 401, "Unauthorized");
    }

    console.log(req.user.userid);
    // Find sender account
    const sender = await Account.findOne({ userId: req.user.userid }).session(
      session
    );
    if (!sender) {
      await session.abortTransaction();
      return HandleResponse(res, false, 404, "Sender account not found");
    }

    // Check sender balance
    if (sender.balance < amount) {
      await session.abortTransaction();
      return HandleResponse(res, false, 400, "Insufficient balance");
    }

    // Find receiver account
    const receiver = await Account.findOne({
      accountNumber: receiverAcc,
    }).session(session);
    if (!receiver) {
      await session.abortTransaction();
      return HandleResponse(res, false, 404, "Receiver account not found");
    }

    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save({ session });
    await receiver.save({ session });

    // Log transactions
    const reference = `TXN_${Date.now()}`;
    await Transaction.create(
      [
        {
          senderAcc: sender.accountNumber,
          receiverAcc,
          amount,
          type: "debit",
          status: "success",
          reference,
        },
        {
          senderAcc: sender.accountNumber,
          receiverAcc,
          amount,
          type: "credit",
          status: "success",
          reference,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return HandleResponse(res, true, 200, "Transfer successful", {
      senderAcc: sender.accountNumber,
      receiverAcc,
      amount,
      reference,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// {
//   "email_phonenumber":"ebisichuks09@gmail.com",
//   "password":"Chuks111"
// }
