import express from "express";
import { signUp, signIn } from "../controllers/auth.controller.js";

export const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/signin", signIn);
