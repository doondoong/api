import { DataSource } from "typeorm";
import { envVars } from "./envVars";
import { User } from "../entity/users/USER_ENTITY";

export const dbConnection = new DataSource({
  type: "postgres",
  host: envVars.DB_HOST,
  port: parseInt(envVars.DB_PORT),
  username: envVars.DB_USERNAME,
  password: envVars.DB_PASSWORD,
  database: envVars.DB_DATABASE,
  entities: [User],
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
