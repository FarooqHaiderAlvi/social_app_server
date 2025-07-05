import { Server } from "socket.io";

let io = null;
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.CORS_ORIGIN],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // Handle user joining
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
      console.log(`User ${userId} connected`);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    // Handle request for current online users
    socket.on("requestOnlineUsers", () => {
      socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          // Emit to all clients when a user disconnects
          io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return { io, onlineUsers };
};
