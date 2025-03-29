export default function errorHandler(error, request, reply) {
  request.log.error({
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
  });

  const statusCode = error.statusCode || 500;
  const response = {
    error: statusCode === 500 ? "Internal Server Error" : error.message,
  };

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    response.details = error.stack;
  }

  reply.status(statusCode).send(response);
}
