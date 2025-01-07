import fastify from "fastify";
import dotenv from "dotenv";
import routes from "./src/routes.js";
import errorHandler from "./src/middleware/errorHandler.js";
import helmet from "@fastify/helmet";
import fastifyCsrf from "@fastify/csrf";

dotenv.config();

const app = fastify({ logger: true });

app.register(helmet);
app.register(fastifyCsrf);

routes(app);

app.setErrorHandler(errorHandler);

const start = async () => {
  try {
    await app.listen({ port: 6969 });
    console.log(`Server is running on http://localhost:6969`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
