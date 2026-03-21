import type { FastifyCorsOptions } from "@fastify/cors";
import { allowedOrigins, config } from "./env.js";

export const corsConfig: FastifyCorsOptions = {
  origin: allowedOrigins,
  credentials: config.CORS_CREDENTIALS,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Widget-Key"],
  maxAge: 86400, // 24 hours
  strictPreflight: false,
};
