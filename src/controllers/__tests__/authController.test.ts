import { Request, Response, NextFunction } from "express";
import * as userService from "../../services/userService";
import * as authService from "../../services/authService";
import { register, login } from "../authController";
import * as validators from "../../lib/validators";

jest.mock("../../services/userService");
jest.mock("../../services/authService");
jest.mock("../../lib/validators");

describe("authController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user with valid data", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        dob: "1990-01-01",
      };

      req.body = userData;

      (validators.validateUserInput as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      (userService.createUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: userData.email,
        name: userData.name,
      });

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        email: userData.email,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      req.body = { name: "John" }; // Missing email, password, dob

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });

    it("should return 400 if validation fails", async () => {
      const userData = {
        name: "Jane",
        email: "invalid-email",
        password: "pass",
        dob: "2010-01-01",
      };

      req.body = userData;

      (validators.validateUserInput as jest.Mock).mockReturnValue({
        valid: false,
        errors: ["Invalid email format", "User must be at least 18 years old"],
      });

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Validation failed",
        errors: expect.arrayContaining([
          "Invalid email format",
          "User must be at least 18 years old",
        ]),
      });
    });

    it("should return 409 if email already exists", async () => {
      const userData = {
        name: "John Doe",
        email: "existing@example.com",
        password: "password123",
        dob: "1990-01-01",
      };

      req.body = userData;

      (validators.validateUserInput as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (userService.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: userData.email,
      });

      await register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email already in use",
      });
    });

    it("should call next() on error", async () => {
      const error = new Error("Database error");
      req.body = {
        name: "John",
        email: "john@example.com",
        password: "password123",
        dob: "1990-01-01",
      };

      (validators.validateUserInput as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      });

      (userService.findUserByEmail as jest.Mock).mockRejectedValue(error);

      await register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("should login user with valid credentials", async () => {
      const loginData = {
        email: "john@example.com",
        password: "password123",
      };

      req.body = loginData;

      const user = {
        id: 1,
        email: loginData.email,
        password: "hashed-password",
        role: "user",
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(user);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (authService.generateToken as jest.Mock).mockReturnValue("jwt-token");

      await login(req as Request, res as Response, next);

      expect(userService.findUserByEmail).toHaveBeenCalledWith(
        loginData.email,
        true,
      );
      expect(userService.verifyPassword).toHaveBeenCalledWith(
        loginData.password,
        user.password,
      );
      expect(authService.generateToken).toHaveBeenCalledWith({
        id: user.id,
        role: user.role,
      });
      expect(res.json).toHaveBeenCalledWith({ token: "jwt-token" });
    });

    it("should return 400 if user not found", async () => {
      req.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials",
      });
    });

    it("should return 400 if password is invalid", async () => {
      const loginData = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      req.body = loginData;

      const user = {
        id: 1,
        email: loginData.email,
        password: "hashed-password",
        role: "user",
      };

      (userService.findUserByEmail as jest.Mock).mockResolvedValue(user);
      (userService.verifyPassword as jest.Mock).mockResolvedValue(false);

      await login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials",
      });
    });

    it("should call next() on error", async () => {
      const error = new Error("Database error");
      req.body = {
        email: "john@example.com",
        password: "password123",
      };

      (userService.findUserByEmail as jest.Mock).mockRejectedValue(error);

      await login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
