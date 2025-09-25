import express from "express";
import type { Router } from "express";
import {
  transferMoney,
  getUserTransactions,
  checkuserbalance,
  GetByReference,
  userWithdrawal,
  payElectricityBill,
} from "../controller/transferMoney.ts";
import authMiddleware from "../middleware/authmiddleware.ts";
const transactionRoute: Router = express.Router();

transactionRoute.post("/transfer", authMiddleware, transferMoney);
transactionRoute.get("/transactions/me", authMiddleware, getUserTransactions);
transactionRoute.get("/details/me", authMiddleware, checkuserbalance);
transactionRoute.get("/reference/me", authMiddleware, GetByReference);
transactionRoute.post("/withdrawal/me", authMiddleware, userWithdrawal);
transactionRoute.post("/Eddc/me", authMiddleware, payElectricityBill);
export default transactionRoute;
