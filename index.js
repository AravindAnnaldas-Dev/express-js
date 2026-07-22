import "./src/config/env.js";
import { app } from "./src/app.js";
import { checkDbConnection } from "./src/config/db.js";

const PORT = process.env.PORT || 3002;

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
