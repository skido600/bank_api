import { Request, Response, NextFunction } from "express";
import Auth from "../model/user_schema";
interface AuthRequest extends Request {
  user?: {
    isManeger: boolean;
    userid: string;
    email?: string;
    isverify: boolean;
    full_name?: string;
    accountNumber?: string;
    number?: string;
  };
}
export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userid;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }

    const user = await Auth.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isManeger) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
