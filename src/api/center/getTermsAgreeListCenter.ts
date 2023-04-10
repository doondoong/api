import express from "express";
import { IDBRequest } from "~/types/IDbDeclares";
import { BIND_OUT, DB_TYPE_CURSOR, DB_TYPE_VARCHAR } from "oracledb";
import { getExecProcResult } from "../../utils/mybatisUtils";
import { SelectAgree, SelectAgreeCursor } from "~/types/getTermsAgreeEntity";
import { envVars } from "../../utils/envVars";
import fs from "fs";

/**지점 접속시 보여질 약관 리스트 */
const router = express.Router();

router.post("/", async (req, res) => {
  const reqData = req.body;
  const { TERMSLISTFILE_PATH } = envVars;
  const serviceDiv = reqData?.serviceDiv ?? "C";
  const ccCode = reqData?.ccCode ?? "unknown";
  const serviceCode = reqData?.serviceCode ? Number(reqData?.serviceCode) : 0;
  const userId = reqData?.userId ?? "unknown";
  const sqlId = "selectAgreement";
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(ip);
  // 전체약관리스트 (jsonData)
  let loadData = fs.readFileSync(TERMSLISTFILE_PATH, "utf-8");
  const jsonData = JSON.parse(loadData);

  // 파라미터 값이 없을 경우 bypass 처리
  if (ccCode === "unknown" || serviceCode === 0 || userId === "unknown") {
    let list: SelectAgreeCursor[] = [];
    if (jsonData?.length > 0) {
      await jsonData?.map((item: SelectAgreeCursor) => {
        if (item.SERVICE_DIV === serviceDiv) {
          list.push({
            ...item,
            CHECK: false,
            ip: ip || "unknown",
          });
        }
      });
    }
    return res.status(200).json(list);
  }

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
            ip: ip || "unknown",
          });
        }
      });
    }

    let result: SelectAgreeCursor[] = [];
    await list?.map((it) =>
      userInfo &&
      userInfo?.find(
        (i: { TERMS_REGNO: number }) =>
          Number(i?.TERMS_REGNO) === it?.TERMS_REGNO
      )?.AGREE_YN === "Y"
        ? result.push({ ...it, CHECK: true })
        : result.push({ ...it, CHECK: false })
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message });
  }
});

export default router;
