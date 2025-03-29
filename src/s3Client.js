import { S3Client } from "@aws-sdk/client-s3";
import config from "./config.js";

const s3 = new S3Client({
  region: config.aws.region,
  endpoint: config.aws.endpoint,
  credentials: config.aws.credentials,
});

export default s3;
