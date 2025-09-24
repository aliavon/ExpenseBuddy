const { GraphQLError } = require("graphql");
const { familyMembersResolver } = require("../familyMembers");
const { User, Family } = require("../../../../database/schemas");
const ERROR_CODES = require("../../../../constants/errorCodes");

// Mock the database schemas
jest.mock("../../../../database/schemas", () => ({
  User: {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn()
        })
      })
    })
  },
  Family: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn()
      })
    })
  }
}));

describe("familyMembers resolver", () => {
  let mockContext;
  let mockUser;
  let mockFamily;
  let mockMembers;
  let consoleErrorSpy;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockUser = {
      _id: "user123",
      familyId: "family123",
      firstName: "John",
      lastName: "Doe",
      roleInFamily: "OWNER"
    };

    mockFamily = {
      _id: "family123",
      ownerId: "user123",
      name: "Test Family"
    };

    mockMembers = [
      {
        _id: "user123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        roleInFamily: "OWNER",
        createdAt: new Date("2024-01-01")
      },
      {
        _id: "user124",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        roleInFamily: "MEMBER",
        createdAt: new Date("2024-01-02")
      }
    ];

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: mockUser
      }
    };
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe("authentication checks", () => {
    it("should throw error when auth is missing", async () => {
      const context = {};
      
      await expect(
        familyMembersResolver(null, {}, context)
      ).rejects.toThrow("Authentication required");
    });

    it("should throw error when not authenticated", async () => {
      const context = {
        auth: {
          isAuthenticated: false,
          user: mockUser
        }
      };
      
      await expect(
        familyMembersResolver(null, {}, context)
      ).rejects.toThrow("Authentication required");
    });

    it("should throw error when user is missing", async () => {
      const context = {
        auth: {
          isAuthenticated: true,
          user: null
        }
      };
      
      await expect(
        familyMembersResolver(null, {}, context)
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("family checks", () => {
    it("should throw error when user has no family", async () => {
      mockContext.auth.user.familyId = null;
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("User is not part of any family");
    });

    it("should throw error when familyId is undefined", async () => {
      mockContext.auth.user.familyId = undefined;
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("User is not part of any family");
    });
  });

  describe("authorization checks", () => {
    it("should throw error when family is not found", async () => {
      Family.findById().select().lean.mockResolvedValue(null);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can view members");
    });

    it("should throw error when user is not family owner", async () => {
      const notOwnerFamily = { ...mockFamily, ownerId: "different-owner" };
      Family.findById().select().lean.mockResolvedValue(notOwnerFamily);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can view members");
    });

    it("should throw error when ownerId comparison fails due to different types", async () => {
      const familyWithNumberId = { ...mockFamily, ownerId: 123 };
      Family.findById().select().lean.mockResolvedValue(familyWithNumberId);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Unauthorized: Only family owners can view members");
    });
  });

  describe("successful execution", () => {
    beforeEach(() => {
      Family.findById().select().lean.mockResolvedValue(mockFamily);
      User.find().select().sort().lean.mockResolvedValue(mockMembers);
    });

    it("should return family members successfully", async () => {
      const result = await familyMembersResolver(null, {}, mockContext);
      
      expect(result).toEqual(mockMembers);
      expect(Family.findById).toHaveBeenCalledWith("family123");
      expect(User.find).toHaveBeenCalledWith({
        familyId: "family123",
        isActive: true
      });
    });

    it("should use correct query parameters for User.find", async () => {
      await familyMembersResolver(null, {}, mockContext);
      
      expect(User.find).toHaveBeenCalledWith({
        familyId: "family123",
        isActive: true
      });
    });

    it("should select correct fields for family", async () => {
      await familyMembersResolver(null, {}, mockContext);
      
      expect(Family.findById().select).toHaveBeenCalledWith("ownerId");
    });

    it("should select correct fields for users", async () => {
      await familyMembersResolver(null, {}, mockContext);
      
      expect(User.find().select).toHaveBeenCalledWith(
        "firstName lastName email roleInFamily createdAt"
      );
    });

    it("should sort users correctly", async () => {
      await familyMembersResolver(null, {}, mockContext);
      
      expect(User.find().select().sort).toHaveBeenCalledWith({
        roleInFamily: 1,
        firstName: 1
      });
    });

    it("should return empty array when no members found", async () => {
      User.find().select().sort().lean.mockResolvedValue([]);
      
      const result = await familyMembersResolver(null, {}, mockContext);
      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should re-throw GraphQL errors as-is", async () => {
      const graphqlError = new GraphQLError("Custom GraphQL Error");
      Family.findById().select().lean.mockRejectedValue(graphqlError);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Custom GraphQL Error");
      expect(console.error).toHaveBeenCalledWith(
        "Error in familyMembers:",
        graphqlError
      );
    });

    it("should wrap non-GraphQL errors", async () => {
      const dbError = new Error("Database connection failed");
      Family.findById().select().lean.mockRejectedValue(dbError);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Failed to fetch family members");
      
      expect(console.error).toHaveBeenCalledWith(
        "Error in familyMembers:",
        dbError
      );
    });

    it("should handle User.find errors", async () => {
      Family.findById().select().lean.mockResolvedValue(mockFamily);
      const userError = new Error("User query failed");
      User.find().select().sort().lean.mockRejectedValue(userError);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Failed to fetch family members");
    });
  });

  describe("edge cases", () => {
    it("should handle string vs ObjectId comparison correctly", async () => {
      // Simulate MongoDB ObjectId toString() behavior
      const familyWithObjectId = {
        ...mockFamily,
        ownerId: {
          toString: () => "user123"
        }
      };
      const userWithObjectId = {
        ...mockUser,
        _id: {
          toString: () => "user123"
        }
      };

      mockContext.auth.user = userWithObjectId;
      Family.findById().select().lean.mockResolvedValue(familyWithObjectId);
      User.find().select().sort().lean.mockResolvedValue(mockMembers);
      
      const result = await familyMembersResolver(null, {}, mockContext);
      expect(result).toEqual(mockMembers);
    });

    it("should handle empty family result", async () => {
      Family.findById().select().lean.mockResolvedValue({});
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Failed to fetch family members");
    });

    it("should handle null ownerId", async () => {
      const familyWithNullOwner = { ...mockFamily, ownerId: null };
      Family.findById().select().lean.mockResolvedValue(familyWithNullOwner);
      
      await expect(
        familyMembersResolver(null, {}, mockContext)
      ).rejects.toThrow("Failed to fetch family members");
    });
  });
});
