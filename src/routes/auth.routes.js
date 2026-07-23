import express from "express";
import { signUp, signIn, googleAuth } from "../controllers/auth.controller.js";

export const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/signin", signIn);
authRoutes.post("/auth/google", googleAuth);
