import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../config/db.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EXPIRY_UNIT_MS = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

function expiryToMs(expiry) {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return undefined;
  return Number(match[1]) * EXPIRY_UNIT_MS[match[2]];
}

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
});

function setAuthCookies(res, token, refresh) {
  res.cookie(
    "accessToken",
    token,
    cookieOptions(expiryToMs(process.env.ACCESS_EXPIRY)),
  );
  res.cookie(
    "refreshToken",
    refresh,
    cookieOptions(expiryToMs(process.env.REFRESH_EXPIRY)),
  );
}

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
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password, provider) VALUES ($1, $2, $3, $4)",
      [username, email, hashedPassword, "local"],
    );

    return res
      .status(201)
      .json({ status_code: 201, message: "User registered successfully." });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }
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

    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google Sign-In. Please log in with Google.",
      });
    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (isMatched) {
      const token = jwt.sign(
        { email, id: user.id },
        process.env.JWT_SECRET_TOKEN,
        {
          expiresIn: process.env.ACCESS_EXPIRY,
        },
      );
      const refresh = jwt.sign(
        { email, id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_EXPIRY,
        },
      );

      await pool.query("UPDATE users SET token = $1 WHERE id = $2", [
        refresh,
        user.id,
      ]);

      setAuthCookies(res, token, refresh);

      return res.status(200).json({
        status_code: 200,
        message: "Successfully logged in.",
        token,
        refresh,
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

  if (!idToken) {
    return res.status(400).json({
      message: "idToken is missing.",
    });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Google token." });
  }

  if (!payload.email_verified) {
    return res.status(401).json({ message: "Email is not verified." });
  }

  try {
    const email = payload["email"];

    let userId;
    let statusCode;
    let message;

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      statusCode = 200;
      message = "Successfully logged in.";
    } else {
      const inserted = await pool.query(
        "INSERT INTO users (username, email, provider) VALUES ($1, $2, $3) RETURNING id",
        [payload["given_name"], email, "google"],
      );
      userId = inserted.rows[0].id;
      statusCode = 201;
      message = "User registered successfully.";
    }

    const token = jwt.sign(
      { email, id: userId },
      process.env.JWT_SECRET_TOKEN,
      {
        expiresIn: process.env.ACCESS_EXPIRY,
      },
    );
    const refresh = jwt.sign(
      { email, id: userId },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_EXPIRY,
      },
    );

    await pool.query("UPDATE users SET token = $1 WHERE id = $2", [
      refresh,
      userId,
    ]);

    setAuthCookies(res, token, refresh);

    return res.status(statusCode).json({
      status_code: statusCode,
      message,
      token,
      refresh,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Database Error",
    });
  }
};

export const refreshToken = async (req, res) => {
  const refresh = req.body.refresh || req.cookies.refreshToken;

  if (!refresh) {
    return res.status(400).json({ message: "Token invalid." });
  }

  try {
    const { email, id } = jwt.verify(refresh, process.env.REFRESH_TOKEN_SECRET);

    const accessToken = jwt.sign({ email, id }, process.env.JWT_SECRET_TOKEN, {
      expiresIn: process.env.ACCESS_EXPIRY,
    });

    res.cookie(
      "accessToken",
      accessToken,
      cookieOptions(expiryToMs(process.env.ACCESS_EXPIRY)),
    );

    return res.status(200).json({
      status_code: 200,
      message: "Token refreshed successfully.",
      token: accessToken,
    });
  } catch (error) {
    return res.status(401).json({ message: "Token invalid." });
  }
};

export const userLogout = async (req, res) => {
  const { id } = req.user;

  try {
    await pool.query("UPDATE users SET token = NULL WHERE id = $1", [id]);

    res.clearCookie("accessToken", cookieOptions());
    res.clearCookie("refreshToken", cookieOptions());

    return res.status(200).json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Database Error." });
  }
};
