import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "../controllers/userController.js";

const router = express.Router();

// User profile endpoints
router.get("/profile/:userId", getUserProfile);
router.put("/profile/:userId", updateUserProfile);

// Password endpoints
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password/:userId", changePassword);

export default router;
