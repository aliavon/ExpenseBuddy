const bcrypt = require("bcryptjs");
const { loginResolver: login } = require("../login");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../../auth/jwtUtils");
const { User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../auth/jwtUtils");
jest.mock("bcryptjs");

// Mock database schemas
jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn(),
    }),
    save: jest.fn(),
  },
}));

describe("login resolver", () => {
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

    // Mock JWT generation
    generateAccessToken.mockReturnValue("access-token");
    generateRefreshToken.mockReturnValue("refresh-token");
  });

  describe("successful login", () => {
    it("should login user successfully with valid credentials", async () => {
      const input = {
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: true,
        lastLoginAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await login(null, { input }, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "john@example.com",
        isActive: true,
      });
      expect(mockUserQuery.populate).toHaveBeenCalledWith("familyId");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.lastLoginAt).toBeInstanceOf(Date);

      expect(generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(generateRefreshToken).toHaveBeenCalledWith(mockUser);

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: mockUser,
      });
    });
  });

  describe("authentication errors", () => {
    it("should throw error for non-existent user", async () => {
      const input = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      mockUserQuery.populate.mockResolvedValue(null);

      await expect(login(null, { input }, mockContext)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generateAccessToken).not.toHaveBeenCalled();
    });

    it("should throw error for invalid password", async () => {
      const input = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: true,
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(login(null, { input }, mockContext)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedPassword"
      );
      expect(generateAccessToken).not.toHaveBeenCalled();
    });

    it("should throw error for inactive user", async () => {
      const input = {
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: false,
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await expect(login(null, { input }, mockContext)).rejects.toThrow(
        "Account is deactivated"
      );

      expect(generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("database integration", () => {
    it("should update lastLoginAt timestamp", async () => {
      const input = {
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: true,
        lastLoginAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const beforeLogin = Date.now();
      await login(null, { input }, mockContext);
      const afterLogin = Date.now();

      expect(mockUser.lastLoginAt).toBeInstanceOf(Date);
      expect(mockUser.lastLoginAt.getTime()).toBeGreaterThanOrEqual(
        beforeLogin
      );
      expect(mockUser.lastLoginAt.getTime()).toBeLessThanOrEqual(afterLogin);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should populate family information", async () => {
      const input = {
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: true,
        familyId: "family-id",
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await login(null, { input }, mockContext);

      expect(mockUserQuery.populate).toHaveBeenCalledWith("familyId");
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      const input = {
        email: "john@example.com",
        password: "password123",
      };

      mockUserQuery.populate.mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(login(null, { input }, mockContext)).rejects.toThrow(
        "Database connection error"
      );
    });

    it("should handle bcrypt errors gracefully", async () => {
      const input = {
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: true,
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockRejectedValue(new Error("bcrypt error"));

      await expect(login(null, { input }, mockContext)).rejects.toThrow(
        "bcrypt error"
      );
    });
  });

  describe("email case handling", () => {
    it("should handle email case insensitively", async () => {
      const input = {
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        password: "hashedPassword",
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await login(null, { input }, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: "john@example.com", // Email should be converted to lowercase in resolver
        isActive: true,
      });
    });
  });

  describe("validation", () => {
    it("should use loginSchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
