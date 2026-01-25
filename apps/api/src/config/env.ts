import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  DATABASE_URL: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_JWT_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default(""),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().default("your-jwt-secret-change-in-production"),
  REDIS_URL: z.string().optional(),
})

export const config = envSchema.parse(process.env)

export const isDev = config.NODE_ENV === "development"

export const allowedOrigins = config.ALLOWED_ORIGINS
  ? config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : isDev
    ? ["http://localhost:3000", "http://localhost:5173"]
    : []
