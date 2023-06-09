import express from "express";
import users from "./users";
import auth from "./auth";
import accountBook from "./accountBook";

const api = express.Router();

api.use("/users", users);
api.use("/auth", auth);
api.use("/accountBook", accountBook);
export default api;
