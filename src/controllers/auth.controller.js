import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../config/db.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password, provider) VALUES ($1, $2, $3, $4)",
      [username, email, hashedPassword, "local"],
    );

    return res
      .status(201)
      .json({ status_code: 201, message: "User registered successfully." });
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
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

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
          expiresIn: "1h",
        },
      );
      return res.status(200).json({
        status_code: 200,
        message: "Successfully logged in.",
        token,
      });
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

export const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  try {
    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const email = payload["email"];

      const existing = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
      );

      let userId;
      let username;
      let statusCode;
      let message;

      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        username = existing.rows[0].username;
        statusCode = 200;
        message = "Successfully logged in.";
      } else {
        username = payload["given_name"];
        const inserted = await pool.query(
          "INSERT INTO users (username, email, provider) VALUES ($1, $2, $3) RETURNING id",
          [username, email, "google"],
        );
        userId = inserted.rows[0].id;
        statusCode = 201;
        message = "User registered successfully.";
      }

      const token = jwt.sign(
        { email, id: userId },
        process.env.JWT_SECRET_TOKEN,
        {
          expiresIn: "1h",
        },
      );

      return res.status(statusCode).json({
        status_code: statusCode,
        message,
        token,
      });
    } else {
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Database Error",
    });
  }
};
