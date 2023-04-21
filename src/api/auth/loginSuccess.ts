import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";
import jwt from "jsonwebtoken";
import { envVars } from "../../utils/envVars";

const loginSuccess = express.Router();

loginSuccess.post("/", async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    const data = jwt.varify(token, envVars.ACCESS_SECRET);
    const userData = await dbConnection.manager.findOne(User, {
      where: { email: data.email },
    });

    res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});

export default loginSuccess;
