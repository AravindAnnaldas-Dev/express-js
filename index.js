import "./env.js";
import express from "express";
import cors from "cors";
import { route } from "./routes/users.js";
import { checkDbConnection } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", route);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    console.log("Exiting: could not connect to the database.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}...`);
  });
};

startServer();
