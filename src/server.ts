import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import cors from "cors";
import { envVars } from "./utils/envVars";
import _ from "lodash";
import apiRouter from "./api";
import bodyParser from "body-parser";
import "reflect-metadata";
import { User } from "./entity/users/USER_ENTITY";

// import { DataSource } from "typeorm";

const app = express();
const PORT = 3000;

const originUrls = envVars.ORIGIN_URL;
const whitelist = originUrls?.split(",");
// const connection = new DataSource({
//   type: "postgres",
//   host: envVars.DB_HOST,
//   port: parseInt(envVars.DB_PORT),
//   username: envVars.DB_USERNAME,
//   password: envVars.DB_PASSWORD,
//   database: envVars.DB_DATABASE,
//   entities: [User],
//   synchronize: true,
// });
app.use(
  cors({
    credentials: true,
    origin: (reqOrigin, callback) => {
      if (!reqOrigin || _.includes(whitelist, reqOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api", apiRouter);

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello, World!",
  },
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  // context: () => {
  //   return {
  //     connection,
  //   };
  // },
});

async function startApolloServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
}

startApolloServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Express server is running at http://localhost:${PORT}`);
  });
});
