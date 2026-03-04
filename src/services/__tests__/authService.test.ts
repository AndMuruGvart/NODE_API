import jwt from "jsonwebtoken";
import { generateToken, verifyToken } from "../authService";

jest.mock("jsonwebtoken");

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const user = { id: 1, role: "user" };
      const mockToken = "mock-jwt-token";

      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = generateToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id, role: user.role },
        "test-secret",
        { expiresIn: "1h" },
      );
      expect(token).toBe(mockToken);
    });

    it("should include user id and role in token payload", () => {
      const user = { id: 42, role: "admin" };
      (jwt.sign as jest.Mock).mockReturnValue("token");

      generateToken(user);

      const callArgs = (jwt.sign as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toEqual({ id: 42, role: "admin" });
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = "valid-token";
      const decoded = { id: 1, role: "user" };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      const result = verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret");
      expect(result).toEqual(decoded);
    });

    it("should throw error for invalid token", () => {
      const token = "invalid-token";
      const error = new Error("Invalid token");

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => verifyToken(token)).toThrow("Invalid token");
    });
  });
});
