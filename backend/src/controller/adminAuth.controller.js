import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../db.js";

dotenv.config();

export const adminLogin = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    //  USE THE CORRECT TABLE
    const [rows] = await pool.query(
      "SELECT id, username, password_hash FROM admin WHERE username = ? LIMIT 1",
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = rows[0];

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { adminId: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username FROM admin WHERE id = ? LIMIT 1",
      [req.adminId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ admin: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};