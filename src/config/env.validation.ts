import Joi from 'joi';

// Validated at app startup — missing or invalid values will crash the process immediately.
export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(), // e.g. postgresql://user:pass@localhost:5432/ecom_db

  // JWT — min 32 chars on secret to ensure signing strength
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('30m'), // access token lifetime
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'), // refresh token lifetime

  // Redis
  REDIS_URL: Joi.string().required(), // e.g. redis://localhost:6379

  // Object Storage (MinIO / Cloudflare R2 / S3-compatible)
  STORAGE_ENDPOINT: Joi.string().uri().required(),
  STORAGE_ACCESS_KEY_ID: Joi.string().required(),
  STORAGE_SECRET_ACCESS_KEY: Joi.string().required(),
  STORAGE_BUCKET: Joi.string().required(),
  STORAGE_PUBLIC_URL: Joi.string().uri().required(),
  STORAGE_REGION: Joi.string().default('auto'),
  STORAGE_FORCE_PATH_STYLE: Joi.string().valid('true', 'false').default('false'),

  // CORS
  CORS_ORIGINS: Joi.string().default('*'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(60),
});
