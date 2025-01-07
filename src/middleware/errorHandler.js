export default function errorHandler(error, request, reply) {
  request.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || "Internal Server Error",
  });
}
