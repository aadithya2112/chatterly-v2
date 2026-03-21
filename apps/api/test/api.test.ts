import { describe, it, expect, mock, beforeAll, afterAll, beforeEach } from "bun:test";
import Fastify from "fastify";

// Mock Prisma
const mockFindUnique = mock();
const mockFetch = mock();
mock.module("@repo/db", () => ({
  prisma: {
    widget: {
      findUnique: mockFindUnique,
      create: mock(),
      update: mock(),
      delete: mock(),
      findMany: mock(),
    },
  },
}));

describe("Chat API", () => {
  let server: any;
  let chatRoutes: any;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/test";
    process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "test-clerk-secret";
    process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "test-openrouter-key";
    process.env.OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
    ({ chatRoutes } = await import("../src/routes/chat"));

    server = Fastify();
    await server.register(chatRoutes, { prefix: "/api/chat" });
    await server.ready();
  });

  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFetch.mockReset();
    (globalThis as any).fetch = mockFetch;
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "AI response text" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  });

  afterAll(async () => {
    await server.close();
  });

  it("should return 401 if API key is missing", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      payload: { message: "Hello" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("should return 401 if API key is invalid", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      headers: { "x-widget-key": "invalid_key" },
      payload: { message: "Hello" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("should return 403 if allowedDomains restriction fails", async () => {
    mockFindUnique.mockResolvedValue({
      id: "widget_1",
      enabled: true,
      allowedDomains: ["https://example.com"],
      systemPrompt: "You are helpful",
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      headers: { 
        "x-widget-key": "valid_key",
        "origin": "https://malicious.com"
      },
      payload: { message: "Hello" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("should allow configured base domain and subdomains", async () => {
    mockFindUnique.mockResolvedValue({
      id: "widget_1",
      enabled: true,
      allowedDomains: ["https://example.com"],
      systemPrompt: "You are helpful",
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      headers: { 
        "x-widget-key": "valid_key", 
        "origin": "https://example.com"
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.role).toBe("assistant");
    expect(body.content).toBe("AI response text");
  });

  it("should reject spoofed lookalike domain", async () => {
    mockFindUnique.mockResolvedValue({
      id: "widget_1",
      enabled: true,
      allowedDomains: ["https://example.com"],
      systemPrompt: "You are helpful",
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      headers: {
        "x-widget-key": "valid_key",
        origin: "https://example.com.evil.com",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should reject malformed origin when allowlist is enabled", async () => {
    mockFindUnique.mockResolvedValue({
      id: "widget_1",
      enabled: true,
      allowedDomains: ["https://example.com"],
      systemPrompt: "You are helpful",
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      headers: {
        "x-widget-key": "valid_key",
        origin: "not a url",
      },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 502 when OpenRouter returns non-200", async () => {
    mockFindUnique.mockResolvedValue({
      id: "widget_1",
      enabled: true,
      allowedDomains: [],
      systemPrompt: "You are helpful",
    });
    mockFetch.mockResolvedValue(
      new Response("bad gateway", { status: 500, headers: { "content-type": "text/plain" } }),
    );

    const response = await server.inject({
      method: "POST",
      url: "/api/chat",
      headers: { "x-widget-key": "valid_key", origin: "https://example.com" },
      payload: { message: "Hello" },
    });

    expect(response.statusCode).toBe(502);
  });
});
