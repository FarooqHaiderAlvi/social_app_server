import app from "./src/app.js";
import dotenv from "dotenv";
import connectDB from "./src/db/index.db.js";
dotenv.config();

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on Port: ${PORT}`);
    });
  })
  .catch((error) => console.log("Database connection failure:", error));
