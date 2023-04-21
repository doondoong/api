import express from "express";
import users from "./users";
import auth from "./auth";

const api = express.Router();

api.use("/users", users);
api.use("/auth", auth);

export default api;
