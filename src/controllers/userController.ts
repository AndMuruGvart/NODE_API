import { Response, NextFunction } from "express";
import * as userService from "../services/userService";
import { AuthRequest } from "../middleware/auth";
import { UserResponse } from "../models";

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(String(req.params.id));
    if (req.user?.id !== id && req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const user = await userService.findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await userService.listUsers();
    return res.json(users);
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(String(req.params.id));
    if (req.user?.id !== id && req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await userService.updateUserStatus(
      id,
      userService.Status.INACTIVE,
    );
    const resp: UserResponse = {
      id: updated.id,
      name: updated.fullName ?? null,
      dob: updated.dob ?? null,
      email: updated.email,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    return res.json(resp);
  } catch (err) {
    next(err);
  }
};

export const unblockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(String(req.params.id));
    if (req.user?.id !== id && req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await userService.updateUserStatus(
      id,
      userService.Status.ACTIVE,
    );
    const resp: UserResponse = {
      id: updated.id,
      name: updated.fullName ?? null,
      dob: updated.dob ?? null,
      email: updated.email,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    return res.json(resp);
  } catch (err) {
    next(err);
  }
};
