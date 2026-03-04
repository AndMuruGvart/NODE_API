import { Router } from "express";
import {
  getUserById,
  listUsers,
  blockUser,
  unblockUser,
} from "../controllers/userController";
import {
  authenticate,
  authorizeAdmin,
  checkUserStatus,
} from "../middleware/auth";

const router = Router();

router.get("/", authenticate, checkUserStatus, authorizeAdmin, listUsers);
router.get("/:id", authenticate, checkUserStatus, getUserById);
router.post("/:id/block", authenticate, checkUserStatus, blockUser);
router.post("/:id/unblock", authenticate, checkUserStatus, unblockUser);

export default router;
