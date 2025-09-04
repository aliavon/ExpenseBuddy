const redis = require("redis");
const { getTokenTTL } = require("./jwtUtils");

let redisClient = null;

/**
 * Initialize Redis connection
 */
async function connectRedis() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      lazyConnect: true,
    },
    retry_strategy: (options) => {
      if (options.error?.code === "ECONNREFUSED") {
        console.error("Redis connection refused");
        return new Error("Redis server connection refused");
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error("Redis retry time exhausted");
      }
      if (options.attempt > 10) {
        return undefined;
      }
      // Exponential backoff
      return Math.min(options.attempt * 100, 3000);
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis Client connected");
  });

  redisClient.on("ready", () => {
    console.log("Redis Client ready");
  });

  redisClient.on("end", () => {
    console.log("Redis Client disconnected");
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    throw error;
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
}

/**
 * Add token to blacklist with TTL auto-cleanup
 */
async function blacklistToken(token, reason = "logout") {
  try {
    const client = getRedisClient();

    // Get token TTL for Redis expiry
    const ttl = getTokenTTL(token);

    if (ttl <= 0) {
      // Token already expired, no need to blacklist
      return true;
    }

    const key = `blacklist:${token}`;
    const value = JSON.stringify({
      reason,
      blacklistedAt: new Date().toISOString(),
    });

    // Set with TTL - Redis will auto-delete when token expires
    await client.setEx(key, ttl, value);

    console.log(`Token blacklisted for ${ttl}s, reason: ${reason}`);
    return true;
  } catch (error) {
    console.error("Error blacklisting token:", error);
    throw new Error(`Failed to blacklist token: ${error.message}`);
  }
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(token) {
  try {
    const client = getRedisClient();
    const key = `blacklist:${token}`;

    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    console.error("Error checking token blacklist:", error);
    // Fail safely - if Redis is down, allow token validation
    // but log the error for monitoring
    return false;
  }
}

/**
 * Get blacklist info for token (for debugging)
 */
async function getBlacklistInfo(token) {
  try {
    const client = getRedisClient();
    const key = `blacklist:${token}`;

    const [value, ttl] = await Promise.all([client.get(key), client.ttl(key)]);

    if (!value) {
      return null;
    }

    return {
      ...JSON.parse(value),
      remainingTTL: ttl,
    };
  } catch (error) {
    console.error("Error getting blacklist info:", error);
    return null;
  }
}

/**
 * Clean up expired blacklist entries (manual cleanup)
 * Note: Redis automatically handles TTL cleanup, this is for manual maintenance
 */
async function cleanupExpiredTokens() {
  try {
    const client = getRedisClient();

    // Get all blacklist keys
    const keys = await client.keys("blacklist:*");

    let cleanedCount = 0;
    for (const key of keys) {
      const ttl = await client.ttl(key);

      // TTL -2 means key doesn't exist (expired)
      // TTL -1 means key exists but has no expiry
      if (ttl === -2) {
        cleanedCount++;
      }
    }

    console.log(
      `Redis TTL auto-cleanup: ${cleanedCount} expired tokens removed`
    );
    return cleanedCount;
  } catch (error) {
    console.error("Error during manual cleanup:", error);
    return 0;
  }
}

/**
 * Get blacklist statistics
 */
async function getBlacklistStats() {
  try {
    const client = getRedisClient();

    const keys = await client.keys("blacklist:*");
    const activeTokens = keys.length;

    // Calculate memory usage estimate (rough)
    const avgKeySize = 300; // JWT tokens ~200 chars + prefix + value
    const estimatedMemoryKB = Math.round((activeTokens * avgKeySize) / 1024);

    return {
      activeBlacklistedTokens: activeTokens,
      estimatedMemoryKB,
      redisConnected: client.isReady,
    };
  } catch (error) {
    console.error("Error getting blacklist stats:", error);
    return {
      activeBlacklistedTokens: 0,
      estimatedMemoryKB: 0,
      redisConnected: false,
      error: error.message,
    };
  }
}

/**
 * Disconnect Redis client
 */
async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log("Redis client disconnected");
    } catch (error) {
      console.error("Error disconnecting Redis:", error);
    }
  }
}

/**
 * Health check for Redis connection
 */
async function redisHealthCheck() {
  try {
    const client = getRedisClient();
    await client.ping();
    return { status: "healthy", connected: true };
  } catch (error) {
    return {
      status: "unhealthy",
      connected: false,
      error: error.message,
    };
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  blacklistToken,
  isTokenBlacklisted,
  getBlacklistInfo,
  cleanupExpiredTokens,
  getBlacklistStats,
  disconnectRedis,
  redisHealthCheck,
};
