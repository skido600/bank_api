import dotenv from "dotenv";
dotenv.config();

const port: number = Number(process.env.PORT);
const MONGODB_URL = process.env.MONGODB_URL as string;
const HMAC_VERIFICATION_CODE_SECRET = process.env
  .HMAC_VERIFICATION_CODE_SECRET as string;
const JWT_SEC = process.env.JWT_SEC as string;
export { port, MONGODB_URL, HMAC_VERIFICATION_CODE_SECRET, JWT_SEC };
