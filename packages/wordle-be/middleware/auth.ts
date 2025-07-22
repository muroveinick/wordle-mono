import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/authService";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = await AuthService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Invalid token" });
  }
};

export const optionalAuthMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = await AuthService.verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
};
