import express from "express";
import { getConnection } from "typeorm";
import { User } from "../../entity/users/USER_ENTITY";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const connection = await getConnection();
    const userRepository = connection.getRepository(User);
    const users = await userRepository.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving users");
  }
});

export default router;
