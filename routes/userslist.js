import express from "express";
import { pool } from "../db.js";
export const usersListRoute = express.Router();

usersListRoute.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email FROM users");
    const usersList = result.rows;

    return res
      .status(200)
      .json({ message: "Userslist fetched successfully.", users: usersList });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Database Error" });
  }
});
