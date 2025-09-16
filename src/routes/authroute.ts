import express from "express";
import type { Router } from "express";
import auth from "../controller/authcontroller.ts";

const authroute: Router = express.Router();

authroute.post("/signup", auth.signup);
authroute.post("/verify-email", auth.verifyEmail);
authroute.post("/resend-otp", auth.resendVerificationCode);
authroute.post("/login", auth.login);
export default authroute;
