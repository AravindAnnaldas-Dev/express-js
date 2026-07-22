import express from "express";
import { getUsersList } from "../controllers/users.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const usersRoutes = express.Router();

usersRoutes.get("/users", authenticate, getUsersList);
