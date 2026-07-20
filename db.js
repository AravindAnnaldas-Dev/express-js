import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("error", (err) => {
  console.log("Database disconnected", err);
});

export const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connected");
    return true;
  } catch (err) {
    console.log("Database connection failed:", err);
    return false;
  }
};
