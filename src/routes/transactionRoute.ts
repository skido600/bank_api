import express from "express";
import type { Router } from "express";
import { transferMoney } from "../controller/transferMoney.ts";
import authMiddleware from "../middleware/authmiddleware.ts";
const transactionRoute: Router = express.Router();

transactionRoute.post("/transfer", authMiddleware, transferMoney);
// transactionRoute.get(
//   "/transactions/:accountNumber",
//   authMiddleware,
// //   transaction.getTransactionHistory
// );
export default transactionRoute;
