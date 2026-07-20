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

    res.status(201).json({
      username,
      password,
      hashedPassword,
    });
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
    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Database Error",
    });
  }
});
