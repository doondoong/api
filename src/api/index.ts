import express from "express";
import centerRouter from "./center";

const router = express.Router();

router.use("/center", centerRouter);

export default router;
