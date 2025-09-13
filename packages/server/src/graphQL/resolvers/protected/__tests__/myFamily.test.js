const { myFamilyResolver: myFamily } = require("../myFamily");
const { Family } = require("../../../../database/schemas");

// Mock database schemas
jest.mock("../../../../database/schemas", () => ({
  Family: {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn(),
    }),
    save: jest.fn(),
  },
}));

describe("myFamily resolver", () => {
  let mockContext;
  let mockFamilyQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock query object with chainable populate
    mockFamilyQuery = {
      populate: jest.fn().mockReturnValue({
        populate: jest.fn(),
      }),
    };
    Family.findOne.mockReturnValue(mockFamilyQuery);
  });

  describe("successful queries", () => {
    it("should return current user's family with populated data", async () => {
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

      const mockFamily = {
        _id: "family-id",
        name: "Doe Family",
        description: "Our wonderful family",
        ownerId: {
          _id: "owner-id",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
        currency: {
          _id: "currency-id",
          name: "US Dollar",
          code: "USD",
          symbol: "$",
        },
        timezone: "America/New_York",
        inviteCode: "FAMILY123",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(mockFamily);

      const result = await myFamily(null, {}, mockContext);

      expect(Family.findOne).toHaveBeenCalledWith({
        _id: "family-id",
        isActive: true,
      });
      expect(mockFamilyQuery.populate).toHaveBeenCalledWith("ownerId");
      expect(mockFamilyQuery.populate().populate).toHaveBeenCalledWith(
        "currency"
      );

      expect(result).toEqual(mockFamily);
    });

    it("should handle family with minimal data", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "family-id",
          },
        },
      };

      const mockFamily = {
        _id: "family-id",
        name: "Simple Family",
        description: "",
        ownerId: {
          _id: "owner-id",
          firstName: "Jane",
          lastName: "Smith",
        },
        currency: {
          _id: "currency-id",
          code: "USD",
        },
        timezone: "UTC",
        inviteCode: null,
        isActive: true,
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(mockFamily);

      const result = await myFamily(null, {}, mockContext);

      expect(result).toEqual(mockFamily);
      expect(result.description).toBe("");
      expect(result.inviteCode).toBeNull();
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      mockContext = {
        auth: {
          isAuthenticated: false,
        },
      };

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );

      expect(Family.findOne).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing", async () => {
      mockContext = {
        auth: null,
      };

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );

      expect(Family.findOne).not.toHaveBeenCalled();
    });

    it("should throw error if auth is undefined", async () => {
      mockContext = {};

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Authentication required"
      );
    });
  });

  describe("family validation errors", () => {
    it("should throw error if family not found", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "nonexistent-family-id",
          },
        },
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(null);

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Family not found"
      );

      expect(Family.findOne).toHaveBeenCalledWith({
        _id: "nonexistent-family-id",
        isActive: true,
      });
    });

    it("should throw error if family is deactivated", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "deactivated-family-id",
          },
        },
      };

      // findOne with isActive: true returns null for deactivated families
      mockFamilyQuery.populate().populate.mockResolvedValue(null);

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Family not found"
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
            familyId: "family-id",
          },
        },
      };

      mockFamilyQuery
        .populate()
        .populate.mockRejectedValue(new Error("Database connection error"));

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Database connection error"
      );
    });

    it("should handle owner population errors", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "family-id",
          },
        },
      };

      Family.findOne.mockReturnValue({
        populate: jest.fn().mockImplementation((field) => {
          if (field === "ownerId") {
            throw new Error("Owner population error");
          }
          return { populate: jest.fn().mockReturnThis() };
        }),
      });

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Owner population error"
      );
    });

    it("should handle currency population errors", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "family-id",
          },
        },
      };

      Family.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest
            .fn()
            .mockRejectedValue(new Error("Currency population error")),
        }),
      });

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Currency population error"
      );
    });
  });

  describe("auth context variations", () => {
    it("should work with different family ID formats", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "507f1f77bcf86cd799439011", // ObjectId format
          },
        },
      };

      const mockFamily = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test Family",
        isActive: true,
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(mockFamily);

      const result = await myFamily(null, {}, mockContext);

      expect(Family.findOne).toHaveBeenCalledWith({
        _id: "507f1f77bcf86cd799439011",
        isActive: true,
      });
      expect(result).toEqual(mockFamily);
    });

    it("should handle missing familyId in user context", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: null,
          },
        },
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(null);

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Family not found"
      );

      expect(Family.findOne).toHaveBeenCalledWith({
        _id: null,
        isActive: true,
      });
    });

    it("should handle undefined familyId in user context", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            // familyId is undefined
          },
        },
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(null);

      await expect(myFamily(null, {}, mockContext)).rejects.toThrow(
        "Family not found"
      );
    });
  });

  describe("populated data validation", () => {
    it("should return family even if owner population fails", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "family-id",
          },
        },
      };

      const mockFamily = {
        _id: "family-id",
        name: "Test Family",
        ownerId: null, // Owner not found/populated
        currency: {
          _id: "currency-id",
          code: "USD",
        },
        isActive: true,
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(mockFamily);

      const result = await myFamily(null, {}, mockContext);

      expect(result).toEqual(mockFamily);
      expect(result.ownerId).toBeNull();
    });

    it("should return family even if currency population fails", async () => {
      mockContext = {
        auth: {
          isAuthenticated: true,
          user: {
            id: "user-id",
            familyId: "family-id",
          },
        },
      };

      const mockFamily = {
        _id: "family-id",
        name: "Test Family",
        ownerId: {
          _id: "owner-id",
          firstName: "John",
        },
        currency: null, // Currency not found/populated
        isActive: true,
      };

      mockFamilyQuery.populate().populate.mockResolvedValue(mockFamily);

      const result = await myFamily(null, {}, mockContext);

      expect(result).toEqual(mockFamily);
      expect(result.currency).toBeNull();
    });
  });
});
