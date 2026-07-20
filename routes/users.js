import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
export const route = express.Router();

route.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(402).send("Username is missing!");
  }
  if (!password) {
    return res.status(402).send("Password is missing!");
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ message: "Failed to register user." });
        }

        console.log("User inserted successfully.");

        return res
          .status(201)
          .json({ message: "User registered successfully." });
      },
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
});

route.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    return res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
});
