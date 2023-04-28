import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";
import jwt from "jsonwebtoken";
import { envVars } from "../../utils/envVars";
import bcrypt from "bcrypt";

const login = express.Router();

login.post("/", async (req, res) => {
  const { email, password } = req.body;
  const { ACCESS_SECRET, REFRESH_SECRET } = envVars;

  const targetUser = await dbConnection.manager.findOne(User, {
    where: { email },
  });

  const isMatch = await bcrypt.compare(password, targetUser.password);

  if (!targetUser) {
    return res.status(403).json({ message: "User not found" });
  }
  if (isMatch) {
    try {
      // access Token 발급
      const accessToken = jwt.sign(
        {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
        ACCESS_SECRET,
        {
          expiresIn: "1m",
          issuer: "todayk",
        }
      );
      // refresh Token 발급
      const refreshToken = jwt.sign(
        {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
        REFRESH_SECRET,
        {
          expiresIn: "24h",
          issuer: "todayk",
        }
      );
      // token 전송
      res.cookie("accessToken", accessToken, {
        secure: false,
        httpOnly: true,
      });
      res.cookie("refreshToken", refreshToken, {
        secure: false,
        httpOnly: true,
      });
      res.status(200).json("login success");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error");
    }
  } else {
    res.status(500).send("Error");
  }
});

export default login;
