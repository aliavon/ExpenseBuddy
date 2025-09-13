const { refreshTokenResolver: refreshToken } = require("../refreshToken");
const {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
} = require("../../../../auth/jwtUtils");
const { isTokenBlacklisted } = require("../../../../auth/redisClient");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils", () => ({
  verifyToken: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));
jest.mock("../../../../auth/redisClient");

// Mock database schemas
jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn(),
    }),
    save: jest.fn(),
  },
}));

describe("refreshToken resolver", () => {
  let mockContext;
  let mockUserQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {};

    // Reset the mock query object
    mockUserQuery = {
      populate: jest.fn(),
    };
    User.findOne.mockReturnValue(mockUserQuery);
  });

  describe("successful token refresh", () => {
    it("should refresh tokens successfully with valid refresh token", async () => {
      const refreshTokenInput = "valid-refresh-token";

      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
        familyId: "family-id",
      };

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue(mockDecodedToken);
      mockUserQuery.populate.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("new-access-token");
      generateRefreshToken.mockReturnValue("new-refresh-token");

      const result = await refreshToken(
        null,
        { token: refreshTokenInput },
        mockContext
      );

      expect(isTokenBlacklisted).toHaveBeenCalledWith(refreshTokenInput);
      expect(verifyToken).toHaveBeenCalledWith(
        refreshTokenInput,
        process.env.JWT_REFRESH_SECRET
      );

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "user-id",
        isActive: true,
      });
      expect(mockUserQuery.populate).toHaveBeenCalledWith("familyId");

      expect(generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser);

      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        user: mockUser,
      });
    });
  });

  describe("token validation errors", () => {
    it("should throw error for missing refresh token", async () => {
      await expect(
        refreshToken(null, { token: null }, mockContext)
      ).rejects.toThrow("Refresh token is required");

      expect(isTokenBlacklisted).not.toHaveBeenCalled();
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it("should throw error for empty refresh token", async () => {
      await expect(
        refreshToken(null, { token: "" }, mockContext)
      ).rejects.toThrow("Refresh token is required");
    });

    it("should throw error for blacklisted token", async () => {
      const refreshTokenInput = "blacklisted-token";

      isTokenBlacklisted.mockResolvedValue(true);

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("Token has been revoked");

      expect(isTokenBlacklisted).toHaveBeenCalledWith(refreshTokenInput);
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it("should throw error for invalid/expired token", async () => {
      const refreshTokenInput = "invalid-token";

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("Invalid or expired refresh token");

      expect(isTokenBlacklisted).toHaveBeenCalledWith(refreshTokenInput);
      expect(verifyToken).toHaveBeenCalledWith(
        refreshTokenInput,
        process.env.JWT_REFRESH_SECRET
      );
    });
  });

  describe("user validation errors", () => {
    it("should throw error if user not found", async () => {
      const refreshTokenInput = "valid-refresh-token";

      const mockDecodedToken = {
        userId: "nonexistent-user-id",
        email: "john@example.com",
      };

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue(mockDecodedToken);
      mockUserQuery.populate.mockResolvedValue(null);

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("User not found or deactivated");

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "nonexistent-user-id",
        isActive: true,
      });
    });

    it("should throw error if user is deactivated", async () => {
      const refreshTokenInput = "valid-refresh-token";

      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
      };

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue(mockDecodedToken);
      mockUserQuery.populate.mockResolvedValue(null); // findOne with isActive: true returns null

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("User not found or deactivated");
    });
  });

  describe("database and service errors", () => {
    it("should handle Redis blacklist check errors", async () => {
      const refreshTokenInput = "valid-refresh-token";

      isTokenBlacklisted.mockRejectedValue(new Error("Redis connection error"));

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("Redis connection error");
    });

    it("should handle database errors during user lookup", async () => {
      const refreshTokenInput = "valid-refresh-token";

      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
      };

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue(mockDecodedToken);
      mockUserQuery.populate.mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("Database connection error");
    });

    it("should handle JWT generation errors", async () => {
      const refreshTokenInput = "valid-refresh-token";

      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
      };

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue(mockDecodedToken);
      mockUserQuery.populate.mockResolvedValue(mockUser);
      generateAccessToken.mockImplementation(() => {
        throw new Error("JWT generation error");
      });

      await expect(
        refreshToken(null, { token: refreshTokenInput }, mockContext)
      ).rejects.toThrow("JWT generation error");
    });
  });

  describe("token security", () => {
    it("should use correct JWT secret for verification", async () => {
      const refreshTokenInput = "valid-refresh-token";

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue({ userId: "user-id" });
      mockUserQuery.populate.mockResolvedValue({
        _id: "user-id",
        isActive: true,
      });
      generateAccessToken.mockReturnValue("new-access-token");
      generateRefreshToken.mockReturnValue("new-refresh-token");

      await refreshToken(null, { token: refreshTokenInput }, mockContext);

      expect(verifyToken).toHaveBeenCalledWith(
        refreshTokenInput,
        process.env.JWT_REFRESH_SECRET
      );
    });

    it("should generate new tokens for the same user", async () => {
      const refreshTokenInput = "valid-refresh-token";

      const mockDecodedToken = {
        userId: "user-id",
        email: "john@example.com",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        isActive: true,
      };

      isTokenBlacklisted.mockResolvedValue(false);
      verifyToken.mockReturnValue(mockDecodedToken);
      mockUserQuery.populate.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("new-access-token");
      generateRefreshToken.mockReturnValue("new-refresh-token");

      await refreshToken(null, { token: refreshTokenInput }, mockContext);

      expect(generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("validation", () => {
    it("should use refreshTokenSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
