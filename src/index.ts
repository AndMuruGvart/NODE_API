import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./lib/rateLimiter";

dotenv.config();

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("Fatal: JWT_SECRET must be set in production.");
  process.exit(1);
}

const app = express();
app.use(express.json());

// Apply global rate limiter
app.use(globalLimiter);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function gracefulShutdown(signal: string) {
  console.log(`${signal} received, closing server and database connections...`);
  server.close(() => {
    prisma
      .$disconnect()
      .then(() => {
        console.log("Database disconnected.");
        process.exit(0);
      })
      .catch((err) => {
        console.error("Error disconnecting from database:", err);
        process.exit(1);
      });
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
