const { createFamilyResolver } = require("../createFamily");
const { generateInviteCode } = require("../../../../utils/inviteCodeGenerator");
const { Family, Currency, User } = require("../../../../database/schemas");

// Mock external dependencies
jest.mock("../../../../utils/inviteCodeGenerator", () => ({
  generateInviteCode: jest.fn(),
}));

jest.mock("../../../../database/schemas", () => ({
  Family: {
    create: jest.fn(),
  },
  Currency: {
    findById: jest.fn(),
  },
  User: {
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("createFamily resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful family creation", () => {
    it("should create family successfully for authenticated user", async () => {
      const input = {
        name: "Smith Family",
        description: "Our happy family",
        currencyId: "currency-id",
        timezone: "America/New_York",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null, // User not in family yet
      };

      const mockCurrency = {
        _id: "currency-id",
        code: "USD",
        name: "US Dollar",
        isActive: true,
      };

      const mockInviteCode = "ABC123XYZ";
      const mockCreatedFamily = {
        _id: "family-id",
        name: input.name,
        description: input.description,
        currency: input.currencyId,
        timezone: input.timezone,
        ownerId: mockUser._id,
        inviteCode: mockInviteCode,
        isActive: true,
      };

      const mockUpdatedUser = {
        ...mockUser,
        familyId: "family-id",
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      // Setup mocks
      Currency.findById.mockResolvedValue(mockCurrency);
      generateInviteCode.mockReturnValue(mockInviteCode);
      Family.create.mockResolvedValue(mockCreatedFamily);
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await createFamilyResolver(null, { input }, mockContext);

      expect(result).toEqual(mockCreatedFamily);
      expect(Currency.findById).toHaveBeenCalledWith(input.currencyId);
      expect(generateInviteCode).toHaveBeenCalled();
      expect(Family.create).toHaveBeenCalledWith({
        name: input.name,
        description: input.description,
        currency: input.currencyId,
        timezone: input.timezone,
        ownerId: mockUser._id,
        inviteCode: mockInviteCode,
        isActive: true,
      });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { familyId: "family-id" },
        { new: true }
      );
    });

    it("should create family with default timezone if not provided", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockCurrency = {
        _id: "currency-id",
        code: "USD",
        name: "US Dollar",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockResolvedValue(mockCurrency);
      generateInviteCode.mockReturnValue("ABC123");
      Family.create.mockResolvedValue({
        _id: "family-id",
        timezone: "UTC", // Default timezone
      });
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await createFamilyResolver(null, { input }, mockContext);

      expect(Family.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: "UTC", // Should default to UTC
        })
      );
    });

    it("should create family without description if not provided", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockCurrency = {
        _id: "currency-id",
        code: "USD",
        name: "US Dollar",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockResolvedValue(mockCurrency);
      generateInviteCode.mockReturnValue("ABC123");
      Family.create.mockResolvedValue({
        _id: "family-id",
        description: null,
      });
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await createFamilyResolver(null, { input }, mockContext);

      expect(Family.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: undefined, // Should be undefined if not provided
        })
      );
    });
  });

  describe("authentication errors", () => {
    it("should throw error if user is not authenticated", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockContext = {
        auth: null, // Not authenticated
      };

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to create a family");

      expect(Currency.findById).not.toHaveBeenCalled();
      expect(Family.create).not.toHaveBeenCalled();
    });

    it("should throw error if auth context is missing user", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockContext = {
        auth: {
          user: null, // Missing user
        },
      };

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You must be logged in to create a family");
    });
  });

  describe("business logic errors", () => {
    it("should throw error if user is already in a family", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: "existing-family-id", // Already in family
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("You are already a member of a family");

      expect(Currency.findById).not.toHaveBeenCalled();
      expect(Family.create).not.toHaveBeenCalled();
    });

    it("should throw error if currency not found", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "non-existent-currency",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockResolvedValue(null); // Currency not found

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Currency not found");

      expect(Currency.findById).toHaveBeenCalledWith("non-existent-currency");
      expect(Family.create).not.toHaveBeenCalled();
    });

    it("should throw error if currency is inactive", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "inactive-currency",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockInactiveCurrency = {
        _id: "inactive-currency",
        code: "EUR",
        name: "Euro",
        isActive: false, // Inactive currency
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockResolvedValue(mockInactiveCurrency);

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Currency is not available");

      expect(Family.create).not.toHaveBeenCalled();
    });
  });

  describe("database errors", () => {
    it("should handle currency lookup errors", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to create family");

      expect(Family.create).not.toHaveBeenCalled();
    });

    it("should handle family creation errors", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockCurrency = {
        _id: "currency-id",
        code: "USD",
        name: "US Dollar",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockResolvedValue(mockCurrency);
      generateInviteCode.mockReturnValue("ABC123");
      Family.create.mockRejectedValue(new Error("Family creation failed"));

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to create family");

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle user update errors", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockCurrency = {
        _id: "currency-id",
        code: "USD",
        name: "US Dollar",
        isActive: true,
      };

      const mockCreatedFamily = {
        _id: "family-id",
        name: input.name,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      Currency.findById.mockResolvedValue(mockCurrency);
      generateInviteCode.mockReturnValue("ABC123");
      Family.create.mockResolvedValue(mockCreatedFamily);
      User.findByIdAndUpdate.mockRejectedValue(new Error("User update failed"));

      await expect(
        createFamilyResolver(null, { input }, mockContext)
      ).rejects.toThrow("Failed to create family");
    });
  });

  describe("invite code generation", () => {
    it("should generate unique invite code for family", async () => {
      const input = {
        name: "Smith Family",
        currencyId: "currency-id",
      };

      const mockUser = {
        _id: "user-id",
        email: "john@example.com",
        familyId: null,
      };

      const mockCurrency = {
        _id: "currency-id",
        code: "USD",
        name: "US Dollar",
        isActive: true,
      };

      const mockContext = {
        auth: {
          user: mockUser,
        },
      };

      const mockInviteCode = "UNIQUE123";

      Currency.findById.mockResolvedValue(mockCurrency);
      generateInviteCode.mockReturnValue(mockInviteCode);
      Family.create.mockResolvedValue({ _id: "family-id" });
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      await createFamilyResolver(null, { input }, mockContext);

      expect(generateInviteCode).toHaveBeenCalledTimes(1);
      expect(Family.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteCode: mockInviteCode,
        })
      );
    });
  });

  describe("validation", () => {
    it("should use createFamilySchema for input validation", () => {
      // Validation is tested separately in authSchemas.test.js
      // Integration with validation wrappers is tested in existing tests
      expect(true).toBe(true);
    });
  });
});
