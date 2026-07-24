import express from "express";
import {
  signUp,
  signIn,
  googleAuth,
  refreshToken,
} from "../controllers/auth.controller.js";

export const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/signin", signIn);
authRoutes.post("/auth/google", googleAuth);
authRoutes.post("/refresh", refreshToken);
