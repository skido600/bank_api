import type { Request, Response, NextFunction } from "express";
import pkg from "jsonwebtoken";
import { JWT_SEC } from "../util/dotenv.ts";
import { HandleResponse } from "../config/HandleResponse.ts";

const { verify } = pkg;
type JwtPayload = pkg.JwtPayload;

// interface AuthRequest extends Request {
//   user?: { userid: string; email?: string } | JwtPayload;
// }
interface AuthRequest extends Request {
  user?:
    | {
        isManeger: boolean;
        userid: string;
        email?: string;
        isverify: boolean;
        full_name?: string;
        accountNumber?: string;
        number?: string;
      }
    | JwtPayload;
}
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authheader = req.headers["authorization"];
  const token = authheader && authheader.split(" ")[1];

  if (!token) {
    return HandleResponse(res, false, 401, "Token not found or invalid");
  }

  try {
    const decoded = verify(token, JWT_SEC!) as {
      isManeger: boolean;
      userid: string;
      email?: string;
      isverify: boolean;
      full_name?: string;
      accountNumber?: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    return HandleResponse(res, false, 401, "Invalid or expired token");
  }
}

export default authMiddleware;
