import type { Request, Response, NextFunction } from "express";
import { transferSchema, receiver } from "../validator/transferSchem.ts";
import { HandleResponse } from "../config/HandleResponse.ts";
import mongoose from "mongoose";
import Account from "../model/AccountSchema.ts";
import Transaction from "../model/transactionSchema.ts";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import sendMailtransaction from "../config/sendTransactionmessage.ts";

import type { TransferBody, userWithdrawalBody } from "../type/types.ts";
import Auth from "../model/user_schema.ts";
import { error } from "console";

interface AuthRequest extends Request {
  user?: {
    sManeger: boolean;
    userid: string;
    email?: string;
    isverify: boolean;
    full_name?: string;
    accountNumber?: string;
    number?: string;
  };
}

// Cron job to credit all users every 3 days
export const creditAllUsers = async (): Promise<void> => {
  try {
    const allAccounts = await Account.find();

    for (const account of allAccounts) {
      account.balance += 10000;
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

export const transferMoney = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { receiverAcc, amount } = req.body as TransferBody;

      const { error } = transferSchema.validate({ receiverAcc, amount });
      if (error) {
        throw new Error(error.details[0]?.message);
      }

      if (!req.user) {
        throw new Error("Unauthorized");
      }
      if (!req.user.isverify) {
        throw new Error("use must be verify befor making any transaction");
      }
      // Find sender account
      const sender = await Account.findOne({
        userId: req.user.userid,
      }).session(session);

      // console.log(`comming from sender ${sender}`);
      if (!sender) {
        throw new Error("Sender account not found");
      }

      // Check sender balance
      if (sender.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Find receiver account
      const receiver = await Account.findOne({
        accountNumber: receiverAcc,
      }).session(session);

      if (!receiver) {
        throw new Error(
          "The account number not found recheck the account number and make your transaction"
        );
      }
      if (String(sender._id) === String(receiver._id)) {
        throw new Error("You cannot transfer money to your own account");
      }
      // Update balances
      sender.balance -= amount;
      receiver.balance += amount;

      await sender.save({ session });
      await receiver.save({ session });

      // Log transactions
      const debitRef = `${uuidv4()}-${Date.now()}`;
      const creditRef = `${uuidv4()}-${Date.now()}`;

      console.log(`debited ref ${debitRef}`);
      console.log(`debited ref ${creditRef}`);
      const tfare = await Transaction.insertMany(
        [
          {
            senderAcc: sender.accountNumber,
            senderName: sender.accountName,
            receiverAcc: receiver.accountNumber,
            receiverName: receiver.accountName,
            amount,
            type: "debit",
            status: "success",
            userId: sender.userId,
            reference: debitRef,
          },
          {
            senderAcc: sender.accountNumber,
            senderName: sender.accountName,
            receiverAcc: receiver.accountNumber,
            receiverName: receiver.accountName,
            amount,
            type: "credit",
            status: "success",
            userId: receiver.userId,
            reference: creditRef,
          },
        ],
        { session, ordered: true }
      );
      await sendMailtransaction({
        topic: "Debit Alert",
        accountName: sender.accountName,
        type: "debited",
        amount,
        otherParty: receiver.accountName,
        reference: debitRef,
        email: sender.Email,
      });

      await sendMailtransaction({
        topic: "Credit Alert",
        accountName: receiver.accountName,
        type: "credited",
        amount,
        otherParty: sender.accountName,
        reference: creditRef,
        email: receiver.Email,
      });
      HandleResponse(
        res,
        true,
        200,
        `Transfer made by ${sender.accountName} to ${receiver.accountName} was successful`,
        tfare
      );
    });
  } catch (err: any) {
    next(err);
  } finally {
    session.endSession();
  }
};

export const getUserTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error("Unauthorized");
    }

    const { userid } = req.user;

    const transactions = await Transaction.find({
      userId: userid,
    }).sort({ createdAt: -1 });
    console.log(transactions);
    if (!transactions || transactions.length === 0) {
      return HandleResponse(
        res,
        false,
        404,
        "No transactions found for this user"
      );
    }

    return HandleResponse(
      res,
      true,
      200,
      "User transactions fetched successfully",
      transactions
    );
  } catch (error) {
    next(error);
  }
};

//get user account details
export const checkuserbalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return HandleResponse(res, false, 401, "Unauthorized");
    }

    const { userid } = req.user;

    const userdetails = await Account.findOne({ userId: userid });

    if (!userdetails) {
      return HandleResponse(res, false, 404, "User details not found");
    }

    return HandleResponse(res, true, 200, "User details", userdetails);
  } catch (error) {
    next(error);
  }
};

//get by reference
export const GetByReference = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return HandleResponse(res, false, 401, "Unauthorized");
    }
    const { ref } = req.query;
    const userdetails = await Transaction.findOne({
      reference: ref,
    });
    if (!userdetails) {
      return HandleResponse(res, false, 404, "invalid reference number");
    }
    return HandleResponse(res, true, 200, "User details", userdetails);
  } catch (error) {
    next(error);
  }
};

// withdrawal
export const userWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (!req.user) {
        return HandleResponse(res, false, 401, "Unauthorized");
      }

      const { userid } = req.user;
      const { amount } = req.body as userWithdrawalBody;

      const { error } = receiver.validate({ amount });
      if (error) {
        return HandleResponse(
          res,
          false,
          400,
          error.details[0]?.message as any
        );
      }

      const userAccount = await Account.findOne({ userId: userid }).session(
        session
      );
      if (!userAccount || userAccount.balance < amount) {
        return HandleResponse(res, false, 400, "Insufficient balance");
      }

      userAccount.balance -= amount;
      await userAccount.save({ session });
      console.log("account", userAccount);
      const debitRef = `${uuidv4()}-${Date.now()}`;
      const creditRef = `${uuidv4()}-${Date.now()}`;
      const bankUser = await Auth.findOne({ email: "ebisileonard@gmail.com" });
      if (!bankUser) {
        console.warn("Bank user not found. Skipping credit transaction.");
      }

      const bankAccount = bankUser
        ? await Account.findOne({ userId: bankUser._id }).session(session)
        : null;
      await Transaction.insertMany(
        [
          {
            senderAcc: userAccount.accountNumber,
            senderName: userAccount.accountName,
            receiverAcc: bankAccount?.accountNumber,
            receiverName: "leo bank",
            amount,
            type: "debit",
            status: "success",
            userId: userid,
            reference: debitRef,
          },
          {
            senderAcc: userAccount.accountNumber,
            senderName: userAccount.accountName,
            receiverAcc: "704000001",
            receiverName: "leo bank",
            amount,
            type: "credit",
            status: "success",
            userId: bankAccount?._id,
            reference: creditRef,
          },
        ],
        { session, ordered: true }
      );

      await sendMailtransaction({
        topic: "Debit Alert",
        accountName: userAccount.accountName,
        type: "debited",
        amount,
        otherParty: "leo bank",
        reference: debitRef,
        email: userAccount.Email,
      });

      await sendMailtransaction({
        topic: "Credit Alert",
        accountName: "leo bank",
        type: "credited",
        amount,
        otherParty: userAccount.accountName,
        reference: creditRef,
        email: "ebisileonard@gmail.com",
      });

      return HandleResponse(
        res,
        true,
        200,
        `Withdrawal of ${amount} successful. Your new balance is ${userAccount.balance}`
      );
    });
  } catch (err) {
    console.error(err);
    next(error);
  } finally {
    session.endSession();
  }
};

export const payElectricityBill = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (!req.user) {
        return HandleResponse(res, false, 401, "Unauthorized");
      }

      const { userid } = req.user;
      const { amount } = req.body as userWithdrawalBody;

      const { error } = receiver.validate({ amount });
      if (error) {
        return HandleResponse(
          res,
          false,
          400,
          error.details[0]?.message as any
        );
      }
      // Find user account
      const userAccount = await Account.findOne({ userId: userid }).session(
        session
      );
      if (!userAccount || userAccount.balance < amount) {
        return HandleResponse(res, false, 400, "Insufficient balance");
      }

      // Deduct amount
      userAccount.balance -= amount;
      await userAccount.save({ session });

      const transactionRef = `${uuidv4()}-${Date.now()}`;

      // Record transaction
      await Transaction.create(
        [
          {
            senderAcc: userAccount.accountNumber,
            senderName: userAccount.accountName,
            receiverAcc: "ELEC-BILL-001",
            receiverName: "Electricity Company",
            amount,
            type: "debit",
            status: "success",
            userId: userid,
            reference: transactionRef,
          },
        ],
        { session }
      );

      // Send debit email
      await sendMailtransaction({
        topic: "Electricity Bill Payment",
        accountName: userAccount.accountName,
        type: "debited",
        amount,
        otherParty: "Electricity Company",
        reference: transactionRef,
        email: userAccount.Email,
      });

      return HandleResponse(
        res,
        true,
        200,
        `Electricity bill payment of ${amount} successful. Your new balance is ${userAccount.balance}`
      );
    });
  } catch (err) {
    console.error(err);
    next(err);
  } finally {
    session.endSession();
  }
};
