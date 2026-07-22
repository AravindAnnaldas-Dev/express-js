import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { googleAuthRoutes } from "./routes/auth.google.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", googleAuthRoutes);
