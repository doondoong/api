import express from "express";
import checkTermsAgree from "./checkTermsAgree";
import getTermsAgreeListCenter from "./getTermsAgreeListCenter";

const router = express.Router();

router.use("/checkTermsAgree", checkTermsAgree);
router.use("/getTermsAgreeListCenter", getTermsAgreeListCenter);

export default router;
