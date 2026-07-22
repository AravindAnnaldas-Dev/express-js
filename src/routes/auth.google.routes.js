import express from "express";
import { googleAuth } from "../controllers/auth.google.controller.js";

export const googleAuthRoutes = express.Router();

googleAuthRoutes.post("/auth/google", googleAuth);
