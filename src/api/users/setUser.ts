import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";

const setUser = express.Router();
setUser.get("/", (req, res) => {
  return res.status(405).send("Method Not Allowed");
});
setUser.post("/", async (req, res) => {
  const { email, name, password } = req.body;
  console.log(email, name, password, "body");
  try {
    const user = new User();
    user.name = name;
    user.email = email;
    user.password = password;
    console.log(user, "user");

    if (!user.email || !user.name || !user.password) {
      return res.status(400).json({ message: "필수값 누락" });
    }
    await dbConnection.manager.save(user);
    res.status(200).send("Successful User Creation");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving users");
  }
});

export default setUser;
