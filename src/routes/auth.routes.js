import express from "express";
import {
  signUp,
  signIn,
  googleAuth,
  refreshToken,
  userLogout,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/signin", signIn);
authRoutes.post("/auth/google", googleAuth);
authRoutes.post("/refresh", refreshToken);
authRoutes.post("/logout", authenticate, userLogout);
