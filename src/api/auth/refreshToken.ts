import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";
import jwt from "jsonwebtoken";
import { envVars } from "../../utils/envVars";

const refreshToken = express.Router();

refreshToken.get("/", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const data = jwt.verify(token, envVars.REFRESH_SECRET);
    const userData = await dbConnection.manager.findOne(User, {
      where: { email: data.email },
    });

    // access Token 발급
    const accessToken = jwt.sign(
      {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
      envVars.ACCESS_SECRET,
      {
        expiresIn: "1m",
        issuer: "todayk",
      }
    );
    res.cookie("accessToken", accessToken, {
      secure: false,
      httpOnly: true,
    });
    res.status(200).json("accessToken Recreated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});

export default refreshToken;
