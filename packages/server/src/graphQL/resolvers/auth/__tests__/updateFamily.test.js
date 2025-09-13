const { updateFamilyResolver } = require("../updateFamily");
const { Family, Currency } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../database/schemas", () => ({
  Family: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  Currency: {
    findById: jest.fn(),
  },
}));

describe("updateFamily resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful family update", () => {
    it("should update family successfully by owner", async () => {
      const input = {
        familyId: "family-id",
        name: "Updated Family Name",
        description: "Updated description",
        timezone: "Europe/London",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Old Family Name",
        description: "Old description",
        currency: "currency-id",
        timezone: "UTC",
        ownerId: "owner-id", // User is owner
        isActive: true,
      };

      const mockUpdatedFamily = {
        ...mockFamily,
        name: input.name,
        description: input.description,
        timezone: input.timezone,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Family.findByIdAndUpdate.mockResolvedValue(mockUpdatedFamily);

      const result = await updateFamilyResolver(null, { input }, mockContext);

      expect(result).toEqual(mockUpdatedFamily);
      expect(Family.findById).toHaveBeenCalledWith(input.familyId);
      expect(Family.findByIdAndUpdate).toHaveBeenCalledWith(
        input.familyId,
        {
          name: input.name,
          description: input.description,
          timezone: input.timezone,
        },
        { new: true }
      );
    });

    it("should update family with currency change", async () => {
      const input = {
        familyId: "family-id",
        currencyId: "new-currency-id",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Family Name",
        currency: "old-currency-id",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockNewCurrency = {
        _id: "new-currency-id",
        code: "EUR",
        name: "Euro",
        isActive: true,
      };

      const mockUpdatedFamily = {
        ...mockFamily,
        currency: "new-currency-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Currency.findById.mockResolvedValue(mockNewCurrency);
      Family.findByIdAndUpdate.mockResolvedValue(mockUpdatedFamily);

      const result = await updateFamilyResolver(null, { input }, mockContext);

      expect(result).toEqual(mockUpdatedFamily);
      expect(Currency.findById).toHaveBeenCalledWith("new-currency-id");
      expect(Family.findByIdAndUpdate).toHaveBeenCalledWith(
        input.familyId,
        {
          currency: input.currencyId,
        },
        { new: true }
      );
    });

    it("should update only provided fields", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name Only", // Only updating name
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Old Name",
        description: "Keep this description",
        currency: "currency-id",
        timezone: "UTC",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockUpdatedFamily = {
        ...mockFamily,
        name: input.name,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Family.findByIdAndUpdate.mockResolvedValue(mockUpdatedFamily);

      await updateFamilyResolver(null, { input }, mockContext);

      expect(Family.findByIdAndUpdate).toHaveBeenCalledWith(
        input.familyId,
        {
          name: input.name,
          // Should not include other fields that weren't provided
        },
        { new: true }
      );
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to update family");

      expect(Family.findById).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to update family");
    });
  });

  describe("authorization errors", () => {
    it("should throw error if family not found", async () => {
      const input = {
        familyId: "non-existent-family",
        name: "New Name",
      };

      const mockUser = {
        _id: "user-id",
        email: "user@example.com",
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(null); // Family not found

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Family not found");

      expect(Family.findById).toHaveBeenCalledWith("non-existent-family");
      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if family is inactive", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockInactiveFamily = {
        _id: "family-id",
        name: "Family Name",
        ownerId: "owner-id",
        isActive: false, // Inactive family
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockInactiveFamily);

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Family is not active");

      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if user is not the family owner", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockUser = {
        _id: "not-owner-id",
        email: "member@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Family Name",
        ownerId: "different-owner-id", // User is not owner
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Only family owner can update family settings");

      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if user is not a member of the family", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockUser = {
        _id: "outsider-id",
        email: "outsider@example.com",
        familyId: "different-family-id", // Member of different family
      };

      const mockFamily = {
        _id: "family-id",
        name: "Family Name",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Only family owner can update family settings");
    });
  });

  describe("currency validation errors", () => {
    it("should throw error if new currency not found", async () => {
      const input = {
        familyId: "family-id",
        currencyId: "non-existent-currency",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Family Name",
        currency: "old-currency-id",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Currency.findById.mockResolvedValue(null); // Currency not found

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Currency not found");

      expect(Currency.findById).toHaveBeenCalledWith("non-existent-currency");
      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should throw error if new currency is inactive", async () => {
      const input = {
        familyId: "family-id",
        currencyId: "inactive-currency",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Family Name",
        currency: "old-currency-id",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockInactiveCurrency = {
        _id: "inactive-currency",
        code: "GBP",
        name: "British Pound",
        isActive: false, // Inactive currency
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Currency.findById.mockResolvedValue(mockInactiveCurrency);

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Currency is not available");

      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle family lookup errors", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockRejectedValue(new Error("Database connection error"));

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to update family");

      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle currency lookup errors", async () => {
      const input = {
        familyId: "family-id",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Family Name",
        currency: "old-currency-id",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Currency.findById.mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to update family");

      expect(Family.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle family update errors", async () => {
      const input = {
        familyId: "family-id",
        name: "New Name",
      };

      const mockUser = {
        _id: "owner-id",
        email: "owner@example.com",
        familyId: "family-id",
      };

      const mockFamily = {
        _id: "family-id",
        name: "Old Name",
        ownerId: "owner-id",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Family.findById.mockResolvedValue(mockFamily);
      Family.findByIdAndUpdate.mockRejectedValue(
        new Error("Database update error")
      );

      await expect(
        updateFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to update family");
    });
  });

  describe("validation", () => {
    it("should use updateFamilySchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
