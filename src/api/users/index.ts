import express from "express";
import setUser from "./setUser";
import getAllUser from "./getAllUser";

const router = express.Router();

router.use("/setUser", setUser);
router.use("/getAllUser", getAllUser);

export default router;
