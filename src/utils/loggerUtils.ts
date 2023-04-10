import winston, { format } from "winston";
import winstonDaily from "winston-daily-rotate-file";
import { envVars } from "./envVars";

const { combine, timestamp, printf } = format;

// 로그 디렉토리(logDir)
// 로그파일 유지 기간 (logMaxDay)
// 최대용량(logMaxSize) 설정(최대 50mb 이며 최대용량 넘어 갔을 경우 새파일로 최대 1000개 까지 생성)
const logDir = envVars.LOG_DIR;
const logMaxDay = envVars.LOG_MAX_DAY;
const logMaxSize = envVars.LOG_MAX_SIZE;

// 로그 레벨 종류 - 더 추가하고 싶으면 아래 레벨에서 선택해서 logKind 배열에 추가
// const logKind = ['error', 'warn', 'info', 'http', 'debug', 'silly'];
// 로그레벨은 아래와 같으며 하위의 레벨은 상위 수준을 포함하여 출력합니다. 즉 info 로그레벨은 error() 를 통해 출력한 error 레벨까지 포함합니다.
// error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
const logKind = envVars.LOG_KIND?.split("|");

// 선언된 로그 레벨에 따른 로그파일 저장 설정
const transport =
  logKind?.map((kind) => {
    return new winstonDaily({
      filename: `${logDir}/myProject-%DATE%.${kind}.log`,
      level: kind,
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: false,
      maxSize: logMaxSize,
      maxFiles: logMaxDay,
      dirname: logDir,
    });
  }) || [];

const formatCombine = combine(
  timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.align(),
  printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  }),
  winston.format.colorize({ message: true })
);

// 로거의 형식 세팅
export const logger = winston.createLogger({
  format: formatCombine,
  transports: [
    new winston.transports.Console({
      format: formatCombine,
    }),
    ...transport,
  ],
});
