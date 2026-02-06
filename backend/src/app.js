import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "node:http";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.route.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

const start = async () => {
  app.set("mongo_user");
  const connectionDb = await mongoose.connect("mongodb://127.0.0.1:27017/Zoom");
  console.log(`Mongo connected DB host: ${connectionDb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log("Listening to port 8000");
  });
};

start();
