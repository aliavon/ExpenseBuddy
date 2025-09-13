const { meResolver: me } = require("../me");
const { User } = require("../../../../database/schemas");

// Mock database schemas
jest.mock("../../../../database/schemas", () => ({
  User: {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn(),
    }),
    save: jest.fn(),
  },
}));

describe("me resolver", () => {
  let mockContext;
  let mockUserQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock query object
    mockUserQuery = {
      populate: jest.fn(),
    };
    User.findOne.mockReturnValue(mockUserQuery);
  });

  describe("successful queries", () => {
    it("should return current user with family information", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            email: "john@example.com",
            familyId: "family-id",
          },
        },
      };

      const mockUser = {
        _id: "user-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        isActive: true,
        familyId: "family-id",
        roleInFamily: "OWNER",
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);

      const result = await me(null, {}, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "user-id",
        isActive: true,
      });
      expect(mockUserQuery.populate).toHaveBeenCalledWith("familyId");

      expect(result).toEqual(mockUser);
    });

    it("should handle user with all fields populated", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            email: "jane@example.com",
          },
        },
      };

      const mockUser = {
        _id: "user-id",
        firstName: "Jane",
        middleName: "Marie",
        lastName: "Smith",
        email: "jane@example.com",
        isEmailVerified: true,
        isVerified: true,
        isActive: true,
        familyId: {
          _id: "family-id",
          name: "Smith Family",
          description: "Our family",
        },
        roleInFamily: "ADMIN",
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);

      const result = await me(null, {}, mockContext);

      expect(result).toEqual(mockUser);
      expect(result.familyId).toBeDefined();
      expect(result.familyId.name).toBe("Smith Family");
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      mockContext = {
        auth: {
          isAuthenticated: false,
        },
      };

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing", async () => {
      mockContext = {
        auth: null,
      };

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should throw error if auth is undefined", async () => {
      mockContext = {};

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );
    });
  });

  describe("user validation errors", () => {
    it("should throw error if user not found in database", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "nonexistent-user-id",
            email: "john@example.com",
          },
        },
      };

      mockUserQuery.populate.mockResolvedValue(null);

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "User not found or deactivated"
      );

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "nonexistent-user-id",
        isActive: true,
      });
    });

    it("should throw error if user is deactivated", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "deactivated-user-id",
            email: "john@example.com",
          },
        },
      };

      // findOne with isActive: true returns null for deactivated users
      mockUserQuery.populate.mockResolvedValue(null);

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "User not found or deactivated"
      );
    });
  });

  describe("database errors", () => {
    it("should handle database connection errors", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            email: "john@example.com",
          },
        },
      };

      mockUserQuery.populate.mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "Database connection error"
      );
    });

    it("should handle populate errors", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            email: "john@example.com",
          },
        },
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Population error")),
      });

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "Population error"
      );
    });
  });

  describe("auth context variations", () => {
    it("should work with different user ID formats", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "507f1f77bcf86cd799439011", // ObjectId format
            email: "john@example.com",
          },
        },
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        isActive: true,
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);

      const result = await me(null, {}, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        _id: "507f1f77bcf86cd799439011",
        isActive: true,
      });
      expect(result).toEqual(mockUser);
    });

    it("should handle missing user object in auth context", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: null,
        },
      };

      await expect(me(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle user with no family", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            email: "john@example.com",
          },
        },
      };

      const mockUser = {
        _id: "user-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        isActive: true,
        familyId: null,
        roleInFamily: null,
      };

      mockUserQuery.populate.mockResolvedValue(mockUser);

      const result = await me(null, {}, mockContext);

      expect(result).toEqual(mockUser);
      expect(result.familyId).toBeNull();
    });
  });
});
