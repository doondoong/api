import express from "express";
import setDayData from "./setDayData";
import getAllUser from "./getAllUser";

const router = express.Router();

router.use("/setDayData", setDayData);
router.use("/getAllUser", getAllUser);

export default router;
