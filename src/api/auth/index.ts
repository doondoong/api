import express from "express";
import login from "./login";
import accessToken from "./accessToken";
import refreshToken from "./refreshToken";
import logout from "./logout";

const auth = express.Router();

auth.use("/login", login);
auth.use("/accessToken", accessToken);
auth.use("/refreshToken", refreshToken);
auth.use("/logout", logout);

export default auth;
