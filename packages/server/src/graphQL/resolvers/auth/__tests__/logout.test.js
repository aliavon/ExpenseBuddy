const { logoutResolver: logout } = require("../logout");
const { extractTokenFromHeader } = require("../../../../auth/jwtUtils");
const { blacklistToken } = require("../../../../auth/redisClient");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils");
jest.mock("../../../../auth/redisClient");

describe("logout resolver", () => {
  let mockContext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: {
          id: "user-id",
          email: "john@example.com",
        },
      },
      request: {
        headers: {
          authorization: "Bearer valid-jwt-token",
        },
      },
    };
  });

  describe("successful logout", () => {
    it("should logout user successfully and blacklist token", async () => {
      extractTokenFromHeader.mockReturnValue("valid-jwt-token");
      blacklistToken.mockResolvedValue(true);

      const result = await logout(null, {}, mockContext);

      expect(extractTokenFromHeader).toHaveBeenCalledWith(
        "Bearer valid-jwt-token"
      );
      expect(blacklistToken).toHaveBeenCalledWith(
        "valid-jwt-token",
        "user_logout"
      );
      expect(result).toBe(true);
    });

    it("should handle Authorization header with capital A", async () => {
      mockContext.request.headers = {
        Authorization: "Bearer valid-jwt-token",
      };

      extractTokenFromHeader.mockReturnValue("valid-jwt-token");
      blacklistToken.mockResolvedValue(true);

      const result = await logout(null, {}, mockContext);

      expect(extractTokenFromHeader).toHaveBeenCalledWith(
        "Bearer valid-jwt-token"
      );
      expect(result).toBe(true);
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      mockContext.auth = {
        isAuthenticated: false,
      };

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );

      expect(extractTokenFromHeader).not.toHaveBeenCalled();
      expect(blacklistToken).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing", async () => {
      mockContext.auth = null;

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );

      expect(extractTokenFromHeader).not.toHaveBeenCalled();
      expect(blacklistToken).not.toHaveBeenCalled();
    });
  });

  describe("authorization header errors", () => {
    it("should throw error if authorization header is missing", async () => {
      mockContext.request.headers = {};

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "No authorization header found"
      );

      expect(extractTokenFromHeader).not.toHaveBeenCalled();
      expect(blacklistToken).not.toHaveBeenCalled();
    });

    it("should throw error if request is missing", async () => {
      mockContext.request = null;

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "No authorization header found"
      );
    });

    it("should throw error if token extraction fails", async () => {
      extractTokenFromHeader.mockReturnValue(null);

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "Invalid authorization header format"
      );

      expect(extractTokenFromHeader).toHaveBeenCalledWith(
        "Bearer valid-jwt-token"
      );
      expect(blacklistToken).not.toHaveBeenCalled();
    });
  });

  describe("redis blacklist errors", () => {
    it("should throw error if blacklisting fails", async () => {
      extractTokenFromHeader.mockReturnValue("valid-jwt-token");
      blacklistToken.mockRejectedValue(new Error("Redis connection error"));

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "Logout failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to blacklist token during logout:",
        expect.any(Error)
      );
      expect(extractTokenFromHeader).toHaveBeenCalledWith(
        "Bearer valid-jwt-token"
      );
      expect(blacklistToken).toHaveBeenCalledWith(
        "valid-jwt-token",
        "user_logout"
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle blacklist service returning false", async () => {
      extractTokenFromHeader.mockReturnValue("valid-jwt-token");
      blacklistToken.mockResolvedValue(false);

      // Blacklist returning false should still be considered success
      // as the service itself handled the token appropriately
      const result = await logout(null, {}, mockContext);
      expect(result).toBe(true);
    });
  });

  describe("context variations", () => {
    it("should handle context.req instead of context.request", async () => {
      mockContext.req = mockContext.request;
      delete mockContext.request;

      extractTokenFromHeader.mockReturnValue("valid-jwt-token");
      blacklistToken.mockResolvedValue(true);

      const result = await logout(null, {}, mockContext);

      expect(extractTokenFromHeader).toHaveBeenCalledWith(
        "Bearer valid-jwt-token"
      );
      expect(result).toBe(true);
    });

    it("should handle missing headers object", async () => {
      mockContext.request = { headers: null };

      await expect(logout(null, {}, mockContext)).rejects.toThrow(
        "No authorization header found"
      );
    });
  });

  describe("token format variations", () => {
    it("should handle different authorization header formats", async () => {
      const testCases = [
        "Bearer jwt-token",
        "bearer jwt-token",
        "JWT jwt-token",
      ];

      for (const authHeader of testCases) {
        mockContext.request.headers.authorization = authHeader;
        extractTokenFromHeader.mockReturnValue("jwt-token");
        blacklistToken.mockResolvedValue(true);

        const result = await logout(null, {}, mockContext);

        expect(extractTokenFromHeader).toHaveBeenCalledWith(authHeader);
        expect(result).toBe(true);

        jest.clearAllMocks();
      }
    });
  });
});
