import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

export const signInRoute = express.Router();

signInRoute.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is missing." });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is missing." });
  }

  try {
    const existing = await pool.query(
      "SELECT id, password FROM users WHERE email = $1",
      [email],
    );

    const user = existing.rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (isMatched) {
      const token = jwt.sign(
        { email, id: user.id },
        process.env.JWT_SECRET_TOKEN,
        {
          expiresIn: "2m",
        },
      );
      return res
        .status(200)
        .json({ message: "Successfully logged in.", token });
    } else {
      return res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Database Error",
    });
  }
});
