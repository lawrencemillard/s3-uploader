import fastify from "fastify";
import dotenv from "dotenv";
import routes from "./src/routes.js";

dotenv.config();

const app = fastify({ logger: true });

routes(app);

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
