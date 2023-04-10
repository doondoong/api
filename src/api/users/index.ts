import express from "express";
import setUser from "./setUser";

const router = express.Router();

router.use("/setUser", setUser);

export default router;
