import express from "express";
import { User } from "../../entity/users/USER_ENTITY";
import dbConnection from "../../utils/dbConnection";

const getAllUser = express.Router();

getAllUser.get("/", async (req, res) => {
  try {
    const users = await dbConnection.manager.find(User);

    if (!users) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving users");
  }
});

export default getAllUser;
