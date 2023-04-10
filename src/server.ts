import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { createConnection } from "typeorm";
import cors from "cors";
import { envVars } from "./utils/envVars";
import _ from "lodash";
import apiRouter from "./api";
import bodyParser from "body-parser";
import "reflect-metadata";
import { User } from "./entity/users/USER_ENTITY";
const app = express();
const PORT = 3000;

const originUrls = envVars.ORIGIN_URL;
const whitelist = originUrls?.split(",");
const connection = createConnection({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User],
  synchronize: true,
});
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
