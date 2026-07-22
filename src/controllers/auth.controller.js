import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";

export const signUp = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username is missing." });
  }
  if (!email) {
    return res.status(400).json({ message: "Email is missing." });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is missing." });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword],
    );

    return res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Database Error",
    });
  }
};

export const signIn = async (req, res) => {
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
};
