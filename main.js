import fastify from "fastify";
import routes from "./src/routes.js";
import errorHandler from "./src/middleware/errorHandler.js";
import helmet from "@fastify/helmet";
import fastifyCsrf from "@fastify/csrf";
import cors from "@fastify/cors";
import config from "./src/config.js";
import { ensureDirsExist } from "./src/utils/misc.js";

ensureDirsExist();

const app = fastify({
  logger: {
    level: "info",
    file: config.logger.file,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname,reqId",
        messageFormat: "{msg} {req.method} {req.url}",
        levelFirst: true,
        singleLine: true,
      },
    },
  },
});

app.register(helmet);
app.register(fastifyCsrf);
app.register(cors, {
  origin: "*",
  methods: ["GET", "POST"],
});

routes(app);

app.setErrorHandler(errorHandler);

const start = async () => {
  try {
    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
