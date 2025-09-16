import express from "express";
import type { Express } from "express";
import { port } from "./util/dotenv.ts";
import connectDb from "./config/connectdb.ts";
import logger from "./util/logger.ts";
import { HandleError, notFound } from "./middleware/ErrorHandling.ts";
import authroute from "./routes/authroute.ts";
import cookieParser from "cookie-parser";

const server: Express = express();

//middleware
server.use(express.json());
server.use(cookieParser());
//routes
server.use("/auth/v1", authroute);

server.use(HandleError);
server.use(notFound);
server.listen(port, async () => {
  await connectDb();
  logger.info(` service is running on port ${port}`);
});
