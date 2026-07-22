import { pool } from "../config/db.js";

export const getUsersList = async (req, res) => {
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
};
