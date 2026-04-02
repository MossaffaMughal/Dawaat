import express from "express";
import {
  createContact,
  getAllContacts,
  deleteContact,
  updateContactStatus,
} from "../controllers/contactController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public route
router.post("/", createContact);

// Admin routes
router.get("/", authenticateToken, authorizeAdmin, getAllContacts);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteContact);
router.put(
  "/:id/status",
  authenticateToken,
  authorizeAdmin,
  updateContactStatus,
);

export default router;
