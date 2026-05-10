import { S3Client } from "@aws-sdk/client-s3";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing S3 environment variable: ${name}`);
  }

  return value;
}

export function s3BucketName() {
  return requireEnv("S3_BUCKET_NAME");
}

function receiptPrefix() {
  const prefix = process.env.S3_RECEIPT_PREFIX || "CHEFS";

  return prefix.replace(/^\/+|\/+$/g, "");
}

export function s3Client() {
  return new S3Client({
    region: requireEnv("AWS_REGION"),
  });
}

export function receiptObjectKey(fileName: string) {
  return `${receiptPrefix()}/${fileName}`;
}
