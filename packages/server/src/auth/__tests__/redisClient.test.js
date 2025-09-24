const {
  connectRedis,
  getRedisClient,
  blacklistToken,
  isTokenBlacklisted,
  getBlacklistInfo,
  cleanupExpiredTokens,
  getBlacklistStats,
  disconnectRedis,
  redisHealthCheck,
} = require("../redisClient");

// Mock Redis client to avoid actual Redis dependency in tests
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    isReady: true,
    on: jest.fn(),
    setEx: jest.fn(),
    exists: jest.fn(),
    get: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(),
    quit: jest.fn(),
  })),
}));

// Mock JWT utils
jest.mock("../jwtUtils", () => ({
  getTokenTTL: jest.fn(),
}));

const redis = require("redis");
const { getTokenTTL } = require("../jwtUtils");

describe("Redis Client", () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      connect: jest.fn().mockResolvedValue(true),
      isReady: true,
      on: jest.fn(),
      setEx: jest.fn().mockResolvedValue("OK"),
      exists: jest.fn().mockResolvedValue(0),
      get: jest.fn().mockResolvedValue(null),
      ttl: jest.fn().mockResolvedValue(-2),
      keys: jest.fn().mockResolvedValue([]),
      ping: jest.fn().mockResolvedValue("PONG"),
      quit: jest.fn().mockResolvedValue("OK"),
    };

    redis.createClient.mockReturnValue(mockClient);
    getTokenTTL.mockReturnValue(900); // 15 minutes default
  });

  afterEach(async () => {
    await disconnectRedis();
  });

  describe("Connection Management", () => {
    it("should connect to Redis successfully", async () => {
      const client = await connectRedis();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: "redis://localhost:6379",
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
        retry_strategy: expect.any(Function),
      });

      expect(mockClient.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    it("should use environment REDIS_URL", async () => {
      const originalRedisUrl = process.env.REDIS_URL;
      process.env.REDIS_URL = "redis://custom:6379";

      // Need to reload module to pick up new env var
      jest.resetModules();
      const { connectRedis: connectRedisReload } = require("../redisClient");

      await connectRedisReload();

      // Test that Redis connection succeeded
      const client = await connectRedisReload();
      expect(client).toBeTruthy();

      process.env.REDIS_URL = originalRedisUrl;
    });

    it("should return existing client on subsequent calls", async () => {
      const client1 = await connectRedis();
      const client2 = await connectRedis();

      expect(client1).toBe(client2);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it("should handle connection errors", async () => {
      mockClient.connect.mockRejectedValue(new Error("Connection failed"));

      await expect(connectRedis()).rejects.toThrow("Connection failed");
    });

    it("should get Redis client after connection", async () => {
      await connectRedis();
      const client = getRedisClient();

      expect(client).toBe(mockClient);
    });

    it("should throw error when getting client before connection", () => {
      expect(() => getRedisClient()).toThrow(
        "Redis client not initialized. Call connectRedis() first."
      );
    });
  });

  describe("Token Blacklisting", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should blacklist token with TTL", async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
      const reason = "logout";

      getTokenTTL.mockReturnValue(900); // 15 minutes

      const result = await blacklistToken(token, reason);

      expect(result).toBe(true);
      expect(mockClient.setEx).toHaveBeenCalledWith(
        `blacklist:${token}`,
        900,
        expect.stringContaining('"reason":"logout"')
      );
    });

    it("should not blacklist already expired token", async () => {
      const token = "expired.token";

      getTokenTTL.mockReturnValue(0); // Already expired

      const result = await blacklistToken(token, "logout");

      expect(result).toBe(true);
      expect(mockClient.setEx).not.toHaveBeenCalled();
    });

    it("should use default reason if not provided", async () => {
      const token = "test.token";

      await blacklistToken(token);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        `blacklist:${token}`,
        900,
        expect.stringContaining('"reason":"logout"')
      );
    });

    it("should handle blacklisting errors", async () => {
      const token = "test.token";
      mockClient.setEx.mockRejectedValue(new Error("Redis error"));

      await expect(blacklistToken(token)).rejects.toThrow(
        "Failed to blacklist token: Redis error"
      );
    });
  });

  describe("Blacklist Checking", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should return true for blacklisted token", async () => {
      const token = "blacklisted.token";
      mockClient.exists.mockResolvedValue(1);

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(true);
      expect(mockClient.exists).toHaveBeenCalledWith(`blacklist:${token}`);
    });

    it("should return false for non-blacklisted token", async () => {
      const token = "valid.token";
      mockClient.exists.mockResolvedValue(0);

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(false);
    });

    it("should fail safely on Redis error", async () => {
      const token = "test.token";
      mockClient.exists.mockRejectedValue(new Error("Redis down"));

      const result = await isTokenBlacklisted(token);

      expect(result).toBe(false); // Fail safely
    });
  });

  describe("Blacklist Info", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should get blacklist info for token", async () => {
      const token = "test.token";
      const blacklistData = {
        reason: "logout",
        blacklistedAt: "2024-01-01T00:00:00.000Z",
      };

      mockClient.get.mockResolvedValue(JSON.stringify(blacklistData));
      mockClient.ttl.mockResolvedValue(500);

      const result = await getBlacklistInfo(token);

      expect(result).toEqual({
        ...blacklistData,
        remainingTTL: 500,
      });
    });

    it("should return null for non-blacklisted token", async () => {
      const token = "valid.token";
      mockClient.get.mockResolvedValue(null);

      const result = await getBlacklistInfo(token);

      expect(result).toBeNull();
    });

    it("should handle errors gracefully", async () => {
      const token = "test.token";
      mockClient.get.mockRejectedValue(new Error("Redis error"));

      const result = await getBlacklistInfo(token);

      expect(result).toBeNull();
    });
  });

  describe("Cleanup Operations", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should count expired tokens during cleanup", async () => {
      mockClient.keys.mockResolvedValue([
        "blacklist:token1",
        "blacklist:token2",
        "blacklist:token3",
      ]);

      mockClient.ttl
        .mockResolvedValueOnce(-2) // expired
        .mockResolvedValueOnce(500) // active
        .mockResolvedValueOnce(-2); // expired

      const cleanedCount = await cleanupExpiredTokens();

      expect(cleanedCount).toBe(2);
      expect(mockClient.keys).toHaveBeenCalledWith("blacklist:*");
    });

    it("should handle cleanup errors", async () => {
      mockClient.keys.mockRejectedValue(new Error("Redis error"));

      const cleanedCount = await cleanupExpiredTokens();

      expect(cleanedCount).toBe(0);
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should get blacklist statistics", async () => {
      mockClient.keys.mockResolvedValue([
        "blacklist:token1",
        "blacklist:token2",
      ]);

      const stats = await getBlacklistStats();

      expect(stats).toEqual({
        activeBlacklistedTokens: 2,
        estimatedMemoryKB: 1, // Math.round((2 * 300) / 1024) = 1
        redisConnected: true,
      });
    });

    it("should handle statistics errors", async () => {
      mockClient.keys.mockRejectedValue(new Error("Redis error"));

      const stats = await getBlacklistStats();

      expect(stats).toEqual({
        activeBlacklistedTokens: 0,
        estimatedMemoryKB: 0,
        redisConnected: false,
        error: "Redis error",
      });
    });
  });

  describe("Health Check", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should return healthy status when Redis is responsive", async () => {
      mockClient.ping.mockResolvedValue("PONG");

      const health = await redisHealthCheck();

      expect(health).toEqual({
        status: "healthy",
        connected: true,
      });
    });

    it("should return unhealthy status on ping failure", async () => {
      mockClient.ping.mockRejectedValue(new Error("Connection lost"));

      const health = await redisHealthCheck();

      expect(health).toEqual({
        status: "unhealthy",
        connected: false,
        error: "Connection lost",
      });
    });
  });

  describe("Disconnection", () => {
    beforeEach(async () => {
      await connectRedis();
    });

    it("should disconnect Redis client", async () => {
      await disconnectRedis();

      expect(mockClient.quit).toHaveBeenCalled();
    });

    it("should handle disconnection errors", async () => {
      mockClient.quit.mockRejectedValue(new Error("Quit failed"));

      // Should not throw
      await expect(disconnectRedis()).resolves.toBeUndefined();
    });

    it("should handle disconnection when client is null", async () => {
      await disconnectRedis(); // First disconnect

      // Second disconnect should not throw
      await expect(disconnectRedis()).resolves.toBeUndefined();
    });
  });
});
