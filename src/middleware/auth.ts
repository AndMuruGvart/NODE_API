import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const getSecret = () => {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production");
  }
  return process.env.JWT_SECRET || "secret";
};

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ message: "Token error" });
  }
  const [, token] = parts;
  try {
    const decoded = jwt.verify(token, getSecret()) as {
      id: number;
      role: string;
    };
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid" });
  }
};

export const checkUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { status: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status === "INACTIVE") {
      return res.status(403).json({ message: "User account is blocked" });
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const authorizeAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
