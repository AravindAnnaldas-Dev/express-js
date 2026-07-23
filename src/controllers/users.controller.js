import { pool } from "../config/db.js";

export const getUsersList = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT username, email, provider FROM users",
    );
    const usersList = result.rows;

    return res.status(200).json({
      status_code: 200,
      message: "Users list fetched successfully.",
      data: usersList,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Database Error" });
  }
};
