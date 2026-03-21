import { z } from "zod"

const DEFAULT_JWT_SECRET = "your-jwt-secret-change-in-production"

const envSchema = z
  .object({
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
    CLERK_AUTHORIZED_PARTIES: z.string().default(""),
    ALLOWED_ORIGINS: z.string().default(""),
    CORS_CREDENTIALS: z.coerce.boolean().default(true),
    JWT_SECRET: z.string().default(DEFAULT_JWT_SECRET),
    REDIS_URL: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().default("deepseek/deepseek-chat"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return

    if (env.JWT_SECRET === DEFAULT_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be set to a secure value in production",
      })
    }

    if (!env.OPENROUTER_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENROUTER_API_KEY"],
        message: "OPENROUTER_API_KEY is required in production",
      })
    }

    if (!env.CLERK_AUTHORIZED_PARTIES.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLERK_AUTHORIZED_PARTIES"],
        message: "CLERK_AUTHORIZED_PARTIES must be set in production",
      })
    }
  })

export const config = envSchema.parse(process.env)

export const isDev = config.NODE_ENV === "development"

export const allowedOrigins = config.ALLOWED_ORIGINS
  ? config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : isDev
    ? ["http://localhost:3000", "http://localhost:5173"]
    : []

export const clerkAuthorizedParties = config.CLERK_AUTHORIZED_PARTIES
  ? config.CLERK_AUTHORIZED_PARTIES.split(",").map((party) => party.trim())
  : isDev
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []
