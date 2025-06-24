const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const path = require("path");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/groups", require("./routes/groups"));

// Socket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Token missing"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  const username = socket.user.username;
  onlineUsers.set(username, socket.id);
  socket.join(username);

  console.log(`🟢 ${username} connected`);

  io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

  socket.on("joinGroup", (groupId) => socket.join(groupId));

  socket.on("sendMessage", (msg) => {
    const { receiver, isGroup } = msg;
    if (isGroup) io.to(receiver).emit("receiveMessage", msg);
    else {
      io.to(receiver).emit("receiveMessage", msg);
      io.to(username).emit("receiveMessage", msg);
    }
  });

  socket.on("typing", ({ receiver, isGroup }) => {
    io.to(receiver).emit("displayTyping", username);
  });

  socket.on("stopTyping", ({ receiver, isGroup }) => {
    io.to(receiver).emit("hideTyping");
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(username);
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    console.log(`🔴 ${username} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
