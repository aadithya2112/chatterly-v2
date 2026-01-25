import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import { chatRoutes } from "../src/routes/chat";

// Mock Prisma
const mockFindUnique = mock();
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

  beforeAll(async () => {
    server = Fastify();
    // Register chat routes
    await server.register(chatRoutes, { prefix: "/api/chat" });
    await server.ready();
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

  it("should return 200 and mocked response for valid request", async () => {
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
    expect(body.content).toContain("Mock AI Response");
  });
});
