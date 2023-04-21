import Dotenv from "dotenv";

Dotenv.config();

// 환경 변수
const envVars = {
  NODE_ENV: process.env.NODE_ENV || "",
  GRAPHQL_SERVER_PORT: process.env.GRAPHQL_SERVER_PORT || "",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  LOG_DIR: process.env.LOG_DIR || "",
  LOG_MAX_DAY: process.env.LOG_MAX_DAY || "",
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || "",
  LOG_KIND: process.env.LOG_KIND || "",
  ORIGIN_URL: process.env.ORIGIN_URL || "",
  PUBLIC_PATH: process.env.PUBLIC_PATH || "",
  HOST: process.env.HOST || "",
  ACCESS_SECRET: process.env.ACCESS_SECRET || "",
  REFRESH_SECRET: process.env.REFRESH_SECRET || "",
};

export { envVars };
