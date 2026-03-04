import { Role, Status, User as PrismaUser } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { CreateUserDTO, UserResponse } from "../models";

type UserSelect = Pick<
  PrismaUser,
  "id" | "fullName" | "dob" | "email" | "createdAt" | "updatedAt"
>;

const mapPrismaUser = (u: UserSelect | null): UserResponse | null => {
  if (!u) return null;
  return {
    id: u.id,
    name: u.fullName ?? null,
    dob: u.dob ?? null,
    email: u.email,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
};

export const createUser = async (
  data: CreateUserDTO,
  role: Role = Role.USER,
): Promise<UserResponse> => {
  const hashed = await bcrypt.hash(data.password, 10);
  const u = await prisma.user.create({
    data: {
      fullName: data.name,
      dob: data.dob instanceof Date ? data.dob : new Date(data.dob),
      email: data.email,
      password: hashed,
      role,
    },
  });
  return mapPrismaUser(u) as UserResponse;
};

export const findUserByEmail = (email: string, includePassword = false) => {
  if (includePassword) {
    return prisma.user.findUnique({ where: { email } });
  }
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      dob: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findUserById = async (
  id: number,
): Promise<UserResponse | null> => {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      dob: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return mapPrismaUser(u);
};

export const listUsers = async (): Promise<UserResponse[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      dob: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return users.map((u) => mapPrismaUser(u) as UserResponse);
};

export const updateUserStatus = (id: number, status: Status) => {
  return prisma.user.update({ where: { id }, data: { status } });
};

export const verifyPassword = (raw: string, hashed: string) => {
  return bcrypt.compare(raw, hashed);
};

export const isAdmin = (role: Role) => role === Role.ADMIN;

// re-export enums for convenience
export { Role, Status };
