import { Router } from "express";
import { register, registerAdmin, login } from "../controllers/authController";
import { authLimiter } from "../lib/rateLimiter";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/register-admin", authLimiter, registerAdmin);
router.post("/login", authLimiter, login);

export default router;
