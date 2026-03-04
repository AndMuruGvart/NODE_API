import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import * as authService from "../services/authService";
import { CreateUserDTO, LoginDTO, UserResponse } from "../models";
import { validateUserInput } from "../lib/validators";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, dob, email, password } = req.body as CreateUserDTO;
    if (!name || !dob || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate email and date of birth with minimum age of 18
    const validation = validateUserInput(email, dob, { minAge: 18 });
    if (!validation.valid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const user = await userService.createUser({
      name,
      dob: new Date(dob),
      email,
      password,
    });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
};

export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, dob, email, password } = req.body as CreateUserDTO;
    if (!name || !dob || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate email and date of birth with minimum age of 18
    const validation = validateUserInput(email, dob, { minAge: 18 });
    if (!validation.valid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const user = await userService.createUser(
      {
        name,
        dob: new Date(dob),
        email,
        password,
      },
      userService.Role.ADMIN,
    );
    return res
      .status(201)
      .json({ id: user.id, email: user.email, role: "ADMIN" });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as LoginDTO;
    const user = await userService.findUserByEmail(email, true);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Check if user is blocked
    if ((user as any).status === "INACTIVE") {
      return res.status(403).json({ message: "User account is blocked" });
    }
    const valid = await userService.verifyPassword(
      password,
      (user as any).password,
    );
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = authService.generateToken({
      id: user.id,
      role: user.role as string,
    });
    return res.json({ token });
  } catch (err) {
    next(err);
  }
};
