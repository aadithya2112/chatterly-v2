export const rateLimitConfig = {
  global: true,
  max: 100,
  timeWindow: "1 minute",
  hook: "preHandler" as const,
  cache: 10000,

  // Custom key generator for user-based limiting
  keyGenerator: (request: any) => {
    return request.user?.id || request.ip;
  },

  // Custom error response
  errorResponseBuilder: (request: any, context: any) => ({
    statusCode: 429,
    error: "Too Many Requests",
    message: `Rate limit exceeded, retry in ${context.after}`,
    retryAfter: context.ttl,
  }),

  // Skip successful requests from counting
  skipOnSuccess: false,

  // Ban after repeated violations
  ban: 10,
  onBanReach: (req: any, key: string) => {
    req.log.warn(`IP ${key} banned due to repeated rate limit violations`);
  },
};

// Stricter rate limiting for public widget endpoints
export const widgetRateLimitConfig = {
  max: 10,
  timeWindow: "1 minute",
  keyGenerator: (request: any) => {
    const widgetKey = request.headers?.["x-widget-key"];
    return widgetKey ? `${request.ip}:${widgetKey}` : request.ip;
  },
  errorResponseBuilder: (request: any, context: any) => ({
    statusCode: 429,
    error: "Too Many Requests",
    message: `Widget rate limit exceeded, retry in ${context.after}`,
    retryAfter: context.ttl,
  }),
};
