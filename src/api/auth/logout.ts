import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";
import jwt from "jsonwebtoken";
import { envVars } from "../../utils/envVars";

const logout = express.Router();

logout.get("/", async (req, res) => {
  try {
    // access Token 삭제
    res.cookie("accessToken", "");
    res.cookie("refreshToken", "");
    res.status(200).json("logout success");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});

export default logout;
