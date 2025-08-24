// index.js
import app from "./src/app.js";
import dotenv from "dotenv";
import connectDB from "./src/db/index.db.js";
import { createServer } from "http";
import { initSocket } from "./src/utils/socket.util.js";
import { watchStories } from "./src/models/story.model.js";
dotenv.config();

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => {
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initSocket(httpServer);
    watchStories();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log("Database connection failure:", error));
