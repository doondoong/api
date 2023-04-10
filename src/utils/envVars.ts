import Dotenv from "dotenv";

Dotenv.config();

// 환경 변수
const envVars = {
  NODE_ENV: process.env.NODE_ENV || "",
  GRAPHQL_SERVER_PORT: process.env.GRAPHQL_SERVER_PORT || "",
  ORACLE_USER: process.env.ORACLE_USER || "",
  ORACLE_PWD: process.env.ORACLE_PWD || "",
  ORACLE_POOL_MAX: process.env.ORACLE_POOL_MAX || "5",
  ORACLE_POOL_MIN: process.env.ORACLE_POOL_MIN || "5",
  DB_KEEP_ALIVE_TIME: process.env.DB_KEEP_ALIVE_TIME || "10000",
  ORACLE_CONSTR: process.env.ORACLE_CONSTR || "",
  MYBATIS_QUERY_PATH: process.env.MYBATIS_QUERY_PATH || "",
  LOG_DIR: process.env.LOG_DIR || "",
  LOG_MAX_DAY: process.env.LOG_MAX_DAY || "",
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || "",
  LOG_KIND: process.env.LOG_KIND || "",
  ORIGIN_URL: process.env.ORIGIN_URL || "",
  PUBLIC_PATH: process.env.PUBLIC_PATH || "",
  TERMS_FILE_NAME: process.env.TERMS_FILE_NAME || "termsList.json",
  HOST: process.env.HOST || "",
};

export { envVars };
