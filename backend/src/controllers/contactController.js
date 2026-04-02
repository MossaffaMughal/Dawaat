import pool from "../config/database.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const result = await pool.query(
      "INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, message],
    );

    res.status(201).json({
      message: "Contact message received",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Create contact error:", error);
    res
      .status(500)
      .json({ message: "Error creating contact", error: error.message });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contacts ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get contacts error:", error);
    res
      .status(500)
      .json({ message: "Error fetching contacts", error: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM contacts WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Delete contact error:", error);
    res
      .status(500)
      .json({ message: "Error deleting contact", error: error.message });
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({
      message: "Contact updated successfully",
      contact: result.rows[0],
    });
  } catch (error) {
    console.error("Update contact error:", error);
    res
      .status(500)
      .json({ message: "Error updating contact", error: error.message });
  }
};
