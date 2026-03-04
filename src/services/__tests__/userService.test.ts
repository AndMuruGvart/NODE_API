import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { createUser, findUserByEmail } from "../userService";
import { CreateUserDTO } from "../../models";

// manually mock prisma client with necessary methods
jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));
jest.mock("bcryptjs");

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user with hashed password", async () => {
      const userData: CreateUserDTO = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        dob: "1990-01-01",
      };

      const hashedPassword = "hashed-password";
      const createdUser = {
        id: 1,
        fullName: userData.name,
        email: userData.email,
        dob: new Date(userData.dob),
        password: hashedPassword,
        role: "user",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          fullName: userData.name,
          dob: expect.any(Date),
          email: userData.email,
          password: hashedPassword,
          role: "USER",
        },
      });
      expect(result).toMatchObject({
        id: 1,
        name: userData.name,
        email: userData.email,
      });
    });

    it("should hash password correctly", async () => {
      const userData: CreateUserDTO = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "securepass123",
        dob: "1995-05-15",
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 2,
        fullName: userData.name,
        email: userData.email,
        dob: new Date(userData.dob),
        password: "hashed",
      });

      await createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith("securepass123", 10);
    });
  });

  describe("findUserByEmail", () => {
    it("should find user by email without password", async () => {
      const email = "user@example.com";
      const user = {
        id: 1,
        fullName: "Test User",
        email,
        role: "user",
        status: "active",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await findUserByEmail(email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
          select: expect.objectContaining({
            id: true,
            fullName: true,
            dob: true,
            email: true,
            role: true,
            status: true,
          }),
        }),
      );
      expect(result).toEqual(user);
    });

    it("should find user by email with password when requested", async () => {
      const email = "user@example.com";
      const user = {
        id: 1,
        email,
        password: "hashed-password",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await findUserByEmail(email, true);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it("should return null when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });
});
