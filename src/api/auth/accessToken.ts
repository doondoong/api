import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";
import jwt from "jsonwebtoken";
import { envVars } from "../../utils/envVars";

const accessToken = express.Router();

accessToken.get("/", async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const verifyAccessToken = (token) => {
      try {
        const payload = jwt.verify(token, envVars.ACCESS_SECRET);
        return payload;
      } catch (err) {
        return null;
      }
    };

    const verifyRefreshToken = (token) => {
      try {
        const payload = jwt.verify(token, envVars.REFRESH_SECRET);
        return payload;
      } catch (err) {
        return null;
      }
    };

    const checkAccessToken = await verifyAccessToken(accessToken);
    const checkRefreshToken = await verifyRefreshToken(refreshToken);

    if (checkAccessToken) {
      // Access Token이 유효한 경우
      const userData = await dbConnection.manager.findOne(User, {
        where: { email: checkAccessToken.email },
      });
      res.status(200).json({ userData, message: "정상사용자입니다." });
    } else if (checkRefreshToken) {
      // Refresh Token이 유효한 경우
      const userData = await dbConnection.manager.findOne(User, {
        where: { email: checkRefreshToken.email },
      });
      const newAccessToken = jwt.sign(
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
      res.cookie("accessToken", newAccessToken, {
        secure: false,
        httpOnly: true,
      });
      res
        .status(200)
        .json({ userData, message: "새로운 Access Token이 발급되었습니다." });
    } else {
      // Access Token과 Refresh Token 모두 유효하지 않은 경우
      res.status(401).send("Invalid token.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});

export default accessToken;
