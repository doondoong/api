import express from "express";
import { SelectAgree, SelectAgreeCursor } from "~/types/getTermsAgreeEntity";
import { IDBRequest } from "~/types/IDbDeclares";
import { envVars } from "../../utils/envVars";
import fs from "fs";
import { BIND_OUT, DB_TYPE_CURSOR, DB_TYPE_VARCHAR } from "oracledb";
import { getExecProcResult } from "../../utils/mybatisUtils";

const router = express.Router();

router.post("/", async (req, res) => {
  const { TERMSLISTFILE_PATH } = envVars;
  const { serviceDiv, ccCode, serviceCode, userId } = req.body;
  const sqlId = "selectAgreementFirst";
  let loadData = fs.readFileSync(TERMSLISTFILE_PATH, "utf-8");
  const jsonData: SelectAgreeCursor[] = JSON.parse(loadData);
  const riderArgs: IDBRequest = {
    queryParams: {
      namespace: "terms.terms0010",
      sqlId,
      params: {
        in_serviceDiv: serviceDiv,
        in_ccCode: ccCode,
        in_serviceCode: Number(serviceCode),
        in_userId: userId,
        out_termsAgreeList: {
          dir: BIND_OUT,
          type: DB_TYPE_CURSOR,
        },
        out_retCode: {
          dir: BIND_OUT,
          type: DB_TYPE_VARCHAR,
        },
        out_retMsg: {
          dir: BIND_OUT,
          type: DB_TYPE_VARCHAR,
        },
      },
    },
  };

  try {
    const userInfoCall = await getExecProcResult<SelectAgree>(riderArgs);

    let list: SelectAgreeCursor[] = [];
    const userInfo: any = userInfoCall?.OUT_RESULT[0].out_termsAgreeList;

    if (jsonData?.length > 0) {
      await jsonData?.map((item: SelectAgreeCursor) => {
        if (item.SERVICE_DIV === serviceDiv) {
          list.push({
            ...item,
            CHECK: false,
          });
        }
      });
    }

    let result: SelectAgreeCursor[] = [];
    let essentialCount = 0;
    let selectCount = 0;

    list?.map((it) => {
      let checkUserInfo =
        userInfo?.find((i: any) => Number(i?.TERMS_REGNO) === it?.TERMS_REGNO)
          ?.AGREE_YN === "Y";
      if (userInfo && checkUserInfo) {
        result.push({ ...it, CHECK: true });
      } else if (it.ESSENTIAL_YN === "Y") {
        essentialCount++, result.push({ ...it, CHECK: false });
      } else {
        selectCount++, result.push({ ...it, CHECK: false });
      }
    });

    if (essentialCount > 0) {
      return res
        .status(210)
        .json({ statusCode: 210, message: `필수누락 ${essentialCount} 개` });
    }
    if (selectCount > 0) {
      return res
        .status(220)
        .json({ statusCode: 220, message: `선택누락 ${selectCount} 개` });
    }
    res.status(200).json({ statusCode: 200, message: "Check Complete" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error });
  }
});

export default router;
