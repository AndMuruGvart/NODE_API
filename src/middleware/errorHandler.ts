import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        res.status(409).json({
          message: "A record with this value already exists.",
          field: (err.meta?.target as string[])?.[0],
        });
        return;
      case "P2025":
        res.status(404).json({ message: "Record not found." });
        return;
      default:
        res.status(400).json({ message: err.message });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ message: "Invalid data provided." });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ message });
}
