import type { Request, Response, NextFunction } from "express";
import pkg from "jsonwebtoken";
import { JWT_SEC } from "../util/dotenv.ts";

const { verify } = pkg;
type JwtPayload = pkg.JwtPayload;

interface AuthRequest extends Request {
  user?: { userid: string; email?: string } | JwtPayload;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = verify(token, JWT_SEC) as {
      userid: string;
      email?: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

export default authMiddleware;
