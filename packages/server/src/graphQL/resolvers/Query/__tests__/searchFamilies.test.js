const { GraphQLError } = require("graphql");
const searchFamilies = require("../searchFamilies");
const { Family, User } = require("../../../../database/schemas");
const ERROR_CODES = require("../../../../constants/errorCodes");

// Mock the database schemas
jest.mock("../../../../database/schemas", () => ({
  Family: {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        limit: jest.fn()
      })
    })
  },
  User: {
    countDocuments: jest.fn()
  }
}));

describe("searchFamilies resolver", () => {
  let mockContext;
  let mockUser;
  let mockFamilies;
  let consoleErrorSpy;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockUser = {
      _id: "user123",
      firstName: "John",
      lastName: "Doe"
    };

    mockFamilies = [
      {
        _id: "family123",
        name: "Smith Family",
        description: "A lovely family",
        isActive: true,
        ownerId: {
          _id: "owner123",
          firstName: "John",
          lastName: "Smith"
        }
      },
      {
        _id: "family124",
        name: "Johnson Family", 
        description: "Another great family",
        isActive: true,
        ownerId: {
          _id: "owner124",
          firstName: "Jane",
          lastName: "Johnson"
        }
      }
    ];

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: mockUser
      }
    };

    // Setup default mock behavior
    Family.find().populate().limit.mockResolvedValue(mockFamilies);
    User.countDocuments.mockResolvedValue(3); // Default member count
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe("authentication checks", () => {
    it("should throw error when auth is missing", async () => {
      const context = {};
      
      await expect(
        searchFamilies(null, { searchTerm: "test" }, context)
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
        searchFamilies(null, { searchTerm: "test" }, context)
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
        searchFamilies(null, { searchTerm: "test" }, context)
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("successful search", () => {
    it("should search families successfully", async () => {
      const result = await searchFamilies(
        null, 
        { searchTerm: "Smith" }, 
        mockContext
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "family123",
        name: "Smith Family",
        description: "A lovely family",
        memberCount: 3,
        owner: {
          _id: "owner123",
          firstName: "John",
          lastName: "Smith"
        }
      });
    });

    it("should use correct search parameters", async () => {
      await searchFamilies(null, { searchTerm: "test" }, mockContext);

      expect(Family.find).toHaveBeenCalledWith({
        name: { $regex: "test", $options: "i" },
        isActive: true
      });
    });

    it("should populate owner information correctly", async () => {
      await searchFamilies(null, { searchTerm: "test" }, mockContext);

      expect(Family.find().populate).toHaveBeenCalledWith(
        "ownerId", 
        "firstName lastName"
      );
    });

    it("should limit results to 10", async () => {
      await searchFamilies(null, { searchTerm: "test" }, mockContext);

      expect(Family.find().populate().limit).toHaveBeenCalledWith(10);
    });

    it("should count members for each family", async () => {
      await searchFamilies(null, { searchTerm: "test" }, mockContext);

      expect(User.countDocuments).toHaveBeenCalledTimes(2);
      expect(User.countDocuments).toHaveBeenCalledWith({
        familyId: "family123",
        isActive: true
      });
      expect(User.countDocuments).toHaveBeenCalledWith({
        familyId: "family124",
        isActive: true
      });
    });

    it("should return empty array when no families found", async () => {
      Family.find().populate().limit.mockResolvedValue([]);

      const result = await searchFamilies(
        null,
        { searchTerm: "nonexistent" },
        mockContext
      );

      expect(result).toEqual([]);
    });

    it("should handle different member counts for different families", async () => {
      User.countDocuments
        .mockResolvedValueOnce(5) // First family has 5 members
        .mockResolvedValueOnce(2); // Second family has 2 members

      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0].memberCount).toBe(5);
      expect(result[1].memberCount).toBe(2);
    });
  });

  describe("search term handling", () => {
    it("should handle empty search term", async () => {
      await searchFamilies(null, { searchTerm: "" }, mockContext);

      expect(Family.find).toHaveBeenCalledWith({
        name: { $regex: "", $options: "i" },
        isActive: true
      });
    });

    it("should handle special characters in search term", async () => {
      const specialTerm = "test.family+name*";
      await searchFamilies(null, { searchTerm: specialTerm }, mockContext);

      expect(Family.find).toHaveBeenCalledWith({
        name: { $regex: specialTerm, $options: "i" },
        isActive: true
      });
    });

    it("should handle case insensitive search", async () => {
      await searchFamilies(null, { searchTerm: "SMITH" }, mockContext);

      expect(Family.find).toHaveBeenCalledWith({
        name: { $regex: "SMITH", $options: "i" },
        isActive: true
      });
    });
  });

  describe("data transformation", () => {
    it("should convert _id to string for id field", async () => {
      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0].id).toBe("family123");
      expect(typeof result[0].id).toBe("string");
    });

    it("should preserve all family fields", async () => {
      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("description");
      expect(result[0]).toHaveProperty("memberCount");
      expect(result[0]).toHaveProperty("owner");
    });

    it("should handle null description", async () => {
      const familyWithNullDesc = {
        ...mockFamilies[0],
        description: null
      };
      Family.find().populate().limit.mockResolvedValue([familyWithNullDesc]);

      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0].description).toBeNull();
    });

    it("should handle undefined description", async () => {
      const familyWithUndefinedDesc = {
        ...mockFamilies[0]
      };
      delete familyWithUndefinedDesc.description;
      Family.find().populate().limit.mockResolvedValue([familyWithUndefinedDesc]);

      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0]).toHaveProperty("description");
      expect(result[0].description).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should handle Family.find errors", async () => {
      const dbError = new Error("Database connection failed");
      Family.find().populate().limit.mockRejectedValue(dbError);

      await expect(
        searchFamilies(null, { searchTerm: "test" }, mockContext)
      ).rejects.toThrow("Failed to search families");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error searching families:",
        dbError
      );
    });

    it("should handle User.countDocuments errors", async () => {
      const countError = new Error("Count query failed");
      User.countDocuments.mockRejectedValue(countError);

      await expect(
        searchFamilies(null, { searchTerm: "test" }, mockContext)
      ).rejects.toThrow("Failed to search families");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error searching families:",
        countError
      );
    });

    it("should handle errors in Promise.all", async () => {
      User.countDocuments
        .mockResolvedValueOnce(3) // First call succeeds
        .mockRejectedValueOnce(new Error("Second count failed")); // Second call fails

      await expect(
        searchFamilies(null, { searchTerm: "test" }, mockContext)
      ).rejects.toThrow("Failed to search families");
    });

    it("should throw GraphQLError with correct code", async () => {
      Family.find().populate().limit.mockRejectedValue(new Error("DB Error"));

      try {
        await searchFamilies(null, { searchTerm: "test" }, mockContext);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect(error.extensions.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle family with null ownerId", async () => {
      const familyWithNullOwner = {
        ...mockFamilies[0],
        ownerId: null
      };
      Family.find().populate().limit.mockResolvedValue([familyWithNullOwner]);

      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0].owner).toBeNull();
    });

    it("should handle zero member count", async () => {
      User.countDocuments.mockResolvedValue(0);

      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0].memberCount).toBe(0);
    });

    it("should handle very long search terms", async () => {
      const longTerm = "a".repeat(1000);
      
      await searchFamilies(null, { searchTerm: longTerm }, mockContext);

      expect(Family.find).toHaveBeenCalledWith({
        name: { $regex: longTerm, $options: "i" },
        isActive: true
      });
    });

    it("should handle families with ObjectId _id", async () => {
      const familyWithObjectId = {
        ...mockFamilies[0],
        _id: {
          toString: () => "family123"
        }
      };
      Family.find().populate().limit.mockResolvedValue([familyWithObjectId]);

      const result = await searchFamilies(
        null,
        { searchTerm: "test" },
        mockContext
      );

      expect(result[0].id).toBe("family123");
    });
  });
});
