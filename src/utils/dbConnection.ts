import { DataSource } from "typeorm";
import { envVars } from "./envVars";
import { User } from "../entity/users/USER_ENTITY";
import { Account } from "../entity/account/ACCOUNT_BOOK_ENTITY";
import { Day } from "../entity/account/DAY_ENTITY";

export const dbConnection = new DataSource({
  type: "postgres",
  host: envVars.DB_HOST,
  port: parseInt(envVars.DB_PORT),
  username: envVars.DB_USERNAME,
  password: envVars.DB_PASSWORD,
  database: envVars.DB_DATABASE,
  entities: [User, Account, Day],
  synchronize: true,
});
dbConnection
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });
export default dbConnection;
