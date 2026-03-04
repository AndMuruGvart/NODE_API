import { Response, NextFunction } from "express";
import * as userService from "../../services/userService";
import { getUserById, listUsers, blockUser } from "../userController";
import { AuthRequest } from "../../middleware/auth";

jest.mock("../../services/userService");

describe("userController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
      user: { id: 1, role: "user" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return user if user is requesting their own data", async () => {
      req.params = { id: "1" };
      req.user = { id: 1, role: "user" };

      const user = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      };

      (userService.findUserById as jest.Mock).mockResolvedValue(user);

      await getUserById(req as AuthRequest, res as Response, next);

      expect(userService.findUserById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("should return user if admin is requesting", async () => {
      req.params = { id: "2" };
      req.user = { id: 1, role: "ADMIN" };

      const user = {
        id: 2,
        name: "Jane Doe",
        email: "jane@example.com",
      };

      (userService.findUserById as jest.Mock).mockResolvedValue(user);

      await getUserById(req as AuthRequest, res as Response, next);

      expect(userService.findUserById).toHaveBeenCalledWith(2);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("should return 403 if user requests another user's data", async () => {
      req.params = { id: "2" };
      req.user = { id: 1, role: "user" };

      await getUserById(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it("should return 404 if user not found", async () => {
      req.params = { id: "1" };
      req.user = { id: 1, role: "user" };

      (userService.findUserById as jest.Mock).mockResolvedValue(null);

      await getUserById(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should call next() on error", async () => {
      const error = new Error("Database error");
      req.params = { id: "1" };
      req.user = { id: 1, role: "user" };

      (userService.findUserById as jest.Mock).mockRejectedValue(error);

      await getUserById(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("listUsers", () => {
    it("should list all users", async () => {
      const users = [
        { id: 1, name: "John", email: "john@example.com" },
        { id: 2, name: "Jane", email: "jane@example.com" },
      ];

      (userService.listUsers as jest.Mock).mockResolvedValue(users);

      await listUsers(req as AuthRequest, res as Response, next);

      expect(userService.listUsers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(users);
    });

    it("should return empty list if no users exist", async () => {
      (userService.listUsers as jest.Mock).mockResolvedValue([]);

      await listUsers(req as AuthRequest, res as Response, next);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should call next() on error", async () => {
      const error = new Error("Database error");
      (userService.listUsers as jest.Mock).mockRejectedValue(error);

      await listUsers(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("blockUser", () => {
    it("should block a user if they request their own block", async () => {
      req.params = { id: "1" };
      req.user = { id: 1, role: "user" };

      const updatedUser = {
        id: 1,
        fullName: "John Doe",
        email: "john@example.com",
        dob: new Date("1990-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.updateUserStatus as jest.Mock).mockResolvedValue(
        updatedUser,
      );

      await blockUser(req as AuthRequest, res as Response, next);

      expect(userService.updateUserStatus).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it("should block a user if admin requests it", async () => {
      req.params = { id: "2" };
      req.user = { id: 1, role: "ADMIN" };

      const updatedUser = {
        id: 2,
        fullName: "Jane Doe",
        email: "jane@example.com",
        dob: new Date("1995-05-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.updateUserStatus as jest.Mock).mockResolvedValue(
        updatedUser,
      );

      await blockUser(req as AuthRequest, res as Response, next);

      expect(userService.updateUserStatus).toHaveBeenCalledWith(
        2,
        expect.any(String),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 403 if user tries to block another user", async () => {
      req.params = { id: "2" };
      req.user = { id: 1, role: "user" };

      await blockUser(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it("should call next() on error", async () => {
      const error = new Error("Database error");
      req.params = { id: "1" };
      req.user = { id: 1, role: "user" };

      (userService.updateUserStatus as jest.Mock).mockRejectedValue(error);

      await blockUser(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
