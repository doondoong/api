import OracleDB from "oracledb";
import GenericPool from "generic-pool";
import _ from "lodash";
import { logger } from "./loggerUtils";
import {
  IResult,
  IDBRequest,
  IDBRequestMultiParams,
  IOracleParamType,
  IDBRequestProcManyParams,
} from "~/types/IDbDeclares";
import { envVars } from "./envVars";

// DB에서 가져온 소스점 표현 이슈 방어 코드
// 이슈 참고: https://github.com/oracle/node-oracledb/issues/638
// 이슈 예제: SELECT 92.1 FROM DUAL;  => 결과: 92.10000000000001
OracleDB.fetchAsString = [OracleDB.NUMBER];

/** DB 커넥션 CONFIG */
const connConfig: OracleDB.ConnectionAttributes = {
  user: envVars.ORACLE_USER,
  password: envVars.ORACLE_PWD,
  connectString: envVars.ORACLE_CONSTR,
};

/** DB 풀 생성, 커넥션 자원 해제 관련 옵션 */
const factory: GenericPool.Factory<OracleDB.Connection> = {
  create: async (): Promise<OracleDB.Connection> => {
    return OracleDB.getConnection(connConfig);
  },
  destroy: async (conn: OracleDB.Connection): Promise<void> => {
    return conn.close();
  },
};

/** DB POOL 옵션 */
const poolOptions: GenericPool.Options = {
  // 자동시작
  autostart: true,
  // 커넥션 연결 타임아웃 시간
  acquireTimeoutMillis: 5000,
  // pool에 일을 안하는 커넥션을 유지하는 시간
  idleTimeoutMillis: 30000,
  // max pool count
  max: parseInt(envVars.ORACLE_POOL_MAX, 10),
  // min pool count
  min: parseInt(envVars.ORACLE_POOL_MIN, 10),
};

/** DB 풀 생성 */
export let pool = GenericPool.createPool<OracleDB.Connection>(
  factory,
  poolOptions
);

/** DB 출력 포멧 형식 ENUM */
export enum DbOutFormat {
  JSON,
  ARRAY,
}

/**
 * DB 출력 포멧 설정
 * @param dbFormat DbOutFormat - JSON | ARRAY
 */
export const setDbOutFormat = (dbFormat: DbOutFormat) => {
  OracleDB.outFormat =
    dbFormat === DbOutFormat.JSON
      ? OracleDB.OUT_FORMAT_OBJECT
      : DbOutFormat.ARRAY;
};

/** DB 롤백 */
export const setRollback = async (acquire: OracleDB.Connection) => {
  if (acquire) {
    await acquire.rollback();
    await pool.release(acquire);
  }
};

/** 커밋 */
export const SetCommit = async (acquire: OracleDB.Connection) => {
  await acquire.commit();
  await pool.release(acquire);
};

/**
 *  프로시저 결과 OUT 커서중 rows값을 가진 커서에 대해서 T[] 형태 RESULT 를 반환한다.
 * @param resultData - T[] 형태 리절트
 * @param rowCount - 미설정시 0으로 세팅됨, 0이면 모든 rows 반환, 그외에는 해당 개수 만큼 rows 반환
 */
export const outRowsCursorResult = async <T>(
  resultData: OracleDB.ResultSet<T>,
  rowCount = 0
) => {
  const targetField: T[] = [];
  let cnt = rowCount > 0 ? 1 : 0;

  while (rowCount >= cnt) {
    const row = await resultData.getRow();

    if (!row) {
      break;
    }

    targetField.push(row);

    if (rowCount > 0) {
      cnt += 1;
    }
  }

  return targetField;
};

export const outCursorByQueryStream = async <T>(
  resultData: OracleDB.ResultSet<T>,
  rowCount = 0
) => {
  const queryStream = resultData.toQueryStream();
  const result: T[] = [];
  let cnt = rowCount > 0 ? 1 : 0;

  const consumeStream = () =>
    new Promise((resolve, reject) => {
      queryStream.on("data", (row: any) => {
        if (row && rowCount >= cnt) {
          result.push(row);

          if (rowCount > 0) {
            cnt += 1;
          }
        }
      });
      queryStream.on("error", reject);
      queryStream.on("close", resolve);
    });

  await consumeStream();

  return result;
};

/**
 * SELECT형의 프로시저 결과 cursor resultSet 타입을 javascript Array type 으로 convert 해서 다시 담음
 * @param result result
 */
export const outCursorResult = async (result: any) => {
  // const res: any = { ...result };
  const res: any = {};

  if (result) {
    // console.log('result', result.OUT_RET_CURSOR);

    const convertCursor = _.map(result, async (val, key) => {
      // 해당 필드가 cursor 형태인지 체크
      const isCursor = val
        ? _.has(Object.getPrototypeOf(val), "getRows")
        : false;

      res[key] = isCursor ? null : val;

      if (val) {
        // ResultSet 타입 결과 => javascript Array 로 convert
        if (isCursor) {
          // query stream 방식
          // res[key] = await outCursorByQueryStream(result[key]);

          // getRow() 방식
          res[key] = await outRowsCursorResult(result[key]);
          result[key].close();
        }
      }
    });

    await Promise.all(convertCursor);

    result = null;
  }

  // console.log('res', res);
  return res;
};

/** 커밋 또는 롤백 실행, code: 00 이면 커밋 */
export const SetRollbackOrCommit = async (
  acquire: OracleDB.Connection,
  code: string,
  isManually: boolean | undefined
) => {
  if (acquire && !isManually) {
    if (code === "00") {
      await acquire.commit();
    } else {
      await acquire.rollback();
    }

    await pool.release(acquire);
  }
};

export const execProc = async <T>(
  dbRequest: IDBRequest
): Promise<IResult<T>> => {
  // DB OUTPUT FORMAT 설정
  setDbOutFormat(DbOutFormat.JSON);

  const { queryParams, acquire, resultCode, resultMsg, isManually } = dbRequest;

  // 결과 default set
  const result: IResult<T> = {
    OUT_RET_CODE: resultCode || "00",
    OUT_RET_MSG: resultMsg || "정상",
    OUT_RESULT: [],
  };

  // query, params get
  const { query, params } = queryParams;

  // DB 커넥션 가져오기
  const connObj: OracleDB.Connection = acquire || (await pool.acquire());

  try {
    // 쿼리 exec
    const { outBinds } = await connObj.execute<T>(
      query || "",
      params as IOracleParamType
    );

    // 커서 형태(리스트) ResultSet 타입 결과를 javascript Array 로 convert 해서 결과값에 담음
    let res = await outCursorResult(outBinds);

    // 리스트 데이터가 있으면 OUT_LIST 에 담음
    result.OUT_RESULT.push(res);

    res = null;
  } catch (ex) {
    logger.error(`execProc Error: ${ex.message}`);

    throw ex;
  } finally {
    await SetRollbackOrCommit(connObj, result.OUT_RET_CODE, isManually);
  }

  return result;
};

/**
 * 기본 SELECT 쿼리 수행
 * @param query 쿼리문
 * @param params DB 파라메터
 */
export const execSelect = async <T>(
  dbRequest: IDBRequest
): Promise<IResult<T>> => {
  // DB OUTPUT FORMAT 설정
  setDbOutFormat(DbOutFormat.JSON);

  const { queryParams, acquire, resultCode, resultMsg, isManually } = dbRequest;

  // DB 커넥션 가져오기
  const connObj: OracleDB.Connection = acquire || (await pool.acquire());

  // 결과 default set
  const result: IResult<T> = {
    OUT_RET_CODE: resultCode || "00",
    OUT_RET_MSG: resultMsg || "정상",
    OUT_RESULT: [],
  };

  // query, params get
  const { query, params } = queryParams;

  try {
    // 쿼리 exec
    /** outBinds는 객체로 리턴 */
    const { rows, outBinds } = await connObj.execute<T>(
      query || "",
      params as IOracleParamType
    );
    // 리스트 데이터가 있으면 OUT_LIST 에 담음
    result.OUT_RESULT = rows && rows.length > 0 ? rows : [];

    /** outBinds가 있는 경우에만 result 객체에 바인딩 */
    if (outBinds) result.OUT_BINDS = outBinds;
  } catch (ex) {
    logger.error(`exec Error: ${ex.message}`);
    result.OUT_RET_CODE = "99";

    throw ex;
  } finally {
    // 수동 트렌젝션처리가 아니면 다 쓴 자원 POOL 로 돌려주기
    if (!isManually) {
      await pool.release(connObj);
    }
  }

  return result;
};

/**
 * 기본 INSERT, UPDATE, DELETE 쿼리 수행
 * @param query 쿼리문
 * @param params DB 파라메터
 */
export const execIUD = async (dbRequest: IDBRequest): Promise<IResult<any>> => {
  // DB OUTPUT FORMAT 설정
  setDbOutFormat(DbOutFormat.JSON);

  const { queryParams, acquire, resultCode, resultMsg, isManually } = dbRequest;

  // DB CONNECTION 객체
  const connObj: OracleDB.Connection = acquire || (await pool.acquire());

  // 결과 default set
  const result: IResult<any> = {
    OUT_RET_CODE: resultCode || "00",
    OUT_RET_MSG: resultMsg || "정상",
    OUT_RESULT: [],
    OUT_BINDS: {},
  };

  try {
    // query, params get
    const { query, params } = queryParams;

    // 쿼리 exec
    const executeResult = await connObj.execute(
      query || "",
      params as IOracleParamType,
      {
        autoCommit: false,
      }
    );

    // 업데이트 시 영향받은 로우 수 바인딩
    result.OUT_BINDS.rowsAffected = executeResult.rowsAffected;
  } catch (ex) {
    logger.error(`execIUD Error: ${ex.message}`);
    result.OUT_RET_CODE = "99";

    throw ex;
  } finally {
    // 수동 트렌젝션처리가 아니면 커밋 또는 롤백 하고 다 쓴 자원 POOL 로 돌려주기
    await SetRollbackOrCommit(connObj, result.OUT_RET_CODE, isManually);
  }

  return result;
};

/** 여러개의 쿼리에 대해 동시 수행 (멀티 INSERT, UPDATE, DELETE시 사용) */
export const execParallel = async (
  dbRequest: IDBRequestMultiParams
): Promise<IResult<any>> => {
  // DB OUTPUT FORMAT 설정
  setDbOutFormat(DbOutFormat.JSON);

  const { queryParams, acquire, resultCode, resultMsg, isManually } = dbRequest;

  // DB CONNECTION 객체
  const connObj: OracleDB.Connection = acquire || (await pool.acquire());

  // RESULT DEFAULT SET
  const result: IResult<any> = {
    OUT_RET_CODE: resultCode || "00",
    OUT_RET_MSG: resultMsg || "정상",
    OUT_RESULT: [],
  };

  try {
    // 여러개의 쿼리문을 수행 및 트렌젝션 처리
    await Promise.all(
      queryParams.map(async ({ query, params }) => {
        // 만약 수행결과 리스트를 담아야할 쿼리라면 OUT_LIST 에 담는다. 그외에는 모두 EXECUTE 만 수행
        const { outBinds } = await connObj.execute(
          query || "",
          params as IOracleParamType,
          {
            autoCommit: false,
          }
        );

        if (outBinds) {
          // 커서 형태(리스트) ResultSet 타입 결과를 javascript Array 로 convert 해서 결과값에 담음
          let res = await outCursorResult(outBinds);

          // 리스트 데이터가 있으면 OUT_LIST 에 담음
          result.OUT_RESULT.push(res);

          res = null;
        }
      })
    );

    if (result.OUT_RESULT.length > 0) {
      const errorResult = _.filter(
        result.OUT_RESULT,
        (val) => val.OUT_RET_CODE !== "00"
      );

      if (errorResult.length > 0) {
        // OUT_RET_CODE 가 '00' 이 아니므로 SetRollbackOrCommit에서
        // rollback 처리 됨
        result.OUT_RET_CODE = "99";
        result.OUT_RET_MSG = errorResult[0].OUT_RET_MSG;
      }
    }
  } catch (ex) {
    logger.error(`execParallel Error: ${ex.message}`);
    result.OUT_RET_CODE = "99";

    throw ex;
  } finally {
    // 수동 트렌젝션처리가 아니면 커밋 또는 롤백 하고 다 쓴 자원 POOL 로 돌려주기
    await SetRollbackOrCommit(connObj, result.OUT_RET_CODE, isManually);
  }

  return result;
};

/** 멀티 프로시저 및 파라메터에 대해 여러번 수행 */
export const execProcMany = async (
  dbRequest: IDBRequestProcManyParams
): Promise<IResult<any>> => {
  // DB OUTPUT FORMAT 설정
  setDbOutFormat(DbOutFormat.JSON);

  const { queryParams, acquire, resultCode, resultMsg, isManually } = dbRequest;

  // 결과 default set
  const result: IResult<any> = {
    OUT_RET_CODE: resultCode || "00",
    OUT_RET_MSG: resultMsg || "정상",
    OUT_RESULT: [],
  };

  // DB 커넥션 가져오기
  const connObj: OracleDB.Connection = acquire || (await pool.acquire());

  try {
    // 여러개의 쿼리문을 수행 및 트렌젝션 처리
    await Promise.all(
      queryParams.map(async ({ params, query }) => {
        const { outBinds } = await connObj.execute(
          query || "",
          params as IOracleParamType,
          {
            autoCommit: false,
          }
        );

        // 커서 형태(리스트) ResultSet 타입 결과를 javascript Array 로 convert 해서 결과값에 담음
        let res = await outCursorResult(outBinds);

        // 리스트 데이터가 있으면 OUT_LIST 에 담음
        result.OUT_RESULT.push(res);

        res = null;
      })
    );

    const errorResult = _.filter(
      result.OUT_RESULT,
      (val) => val.OUT_RET_CODE !== "00"
    );

    // 에러에 매핑된 CODE, MSG가 없는경우 직접 대입
    errorResult.forEach((error) => {
      error.OUT_RET_CODE = error.OUT_RET_CODE ?? "99";
      error.OUT_RET_MSG =
        error.OUT_RET_MSG ?? "알 수 없는 에러가 발생했습니다.";
    });

    if (errorResult.length > 0) {
      // OUT_RET_CODE 가 '00' 이 아니므로 SetRollbackOrCommit에서
      // rollback 처리 됨

      result.OUT_RET_CODE = "99";
      result.OUT_RET_MSG = errorResult[0].OUT_RET_MSG;
    }
  } catch (ex) {
    logger.error(`execProcMany Error: ${ex.message}`);
    result.OUT_RET_CODE = "99";

    throw ex;
  } finally {
    // 수동 트렌젝션처리가 아니면 커밋 또는 롤백 하고 다 쓴 자원 POOL 로 돌려주기
    await SetRollbackOrCommit(connObj, result.OUT_RET_CODE, isManually);
  }

  return result;
};

/** 다수의 파라메터에 대한 단일 쿼리 수행(executeMany) - 하나의 INSERT 쿼리에 여러개의 값을 넣을 때 사용 */
export const execMany = async (
  dbRequest: IDBRequest
): Promise<IResult<any>> => {
  // DB OUTPUT FORMAT 설정
  setDbOutFormat(DbOutFormat.JSON);

  const { queryParams, acquire, resultCode, resultMsg, isManually } = dbRequest;

  // DB CONNECTION 객체
  const connObj: OracleDB.Connection = acquire || (await pool.acquire());

  // 결과 default set
  const result: IResult<any> = {
    OUT_RET_CODE: resultCode || "00",
    OUT_RET_MSG: resultMsg || "정상",
    OUT_RESULT: [],
  };

  try {
    // query, params get
    const { query, params } = queryParams;

    // 쿼리 exec
    await connObj.executeMany(
      query || "",
      params as OracleDB.BindParameters[],
      { autoCommit: false }
    );
  } catch (ex) {
    logger.error(`execMany Error: ${ex.message}`);
    result.OUT_RET_CODE = "99";

    throw ex;
  } finally {
    // 수동 트렌젝션처리가 아니면 커밋 또는 롤백 하고 다 쓴 자원 POOL 로 돌려주기
    await SetRollbackOrCommit(connObj, result.OUT_RET_CODE, isManually);
  }

  return result;
};

// db 서버로의 인터넷 연결이 끊겼을 경우 pool.destory  하여
// 인터넷이 다시 활성화 되었을 때 pool 을 새로 create 하여 사용하게 함
export const dbKeepAlive = async () => {
  try {
    const connObj = await pool.acquire();

    await connObj.ping(async (err) => {
      if (err) {
        await connObj.release();

        pool = GenericPool.createPool<OracleDB.Connection>(
          factory,
          poolOptions
        );
      }
    });

    await pool.release(connObj);
  } catch (ex) {
    logger.error(`dbKeepAlive Error!: ${ex.message}`);
  }
};

// 10초에 한번씩 헬스 체크
setInterval(dbKeepAlive, parseInt(envVars.DB_KEEP_ALIVE_TIME || "10000", 10));
