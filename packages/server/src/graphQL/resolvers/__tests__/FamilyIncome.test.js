const FamilyIncomeResolvers = require("../FamilyIncome");
const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

describe("FamilyIncome resolvers", () => {
  let mockContext;
  let mockParent;

  beforeEach(() => {
    mockContext = global.createMockContext();
    mockParent = {
      typeId: global.createMockId(),
      contributorId: global.createMockId(),
      currencyId: global.createMockId(),
    };
  });

  describe("type resolver", () => {
    it("should load income type successfully", async () => {
      const mockIncomeType = {
        _id: mockParent.typeId,
        name: "Salary",
        description: "Monthly salary income",
      };

      mockContext.loaders.incomeTypeLoader.load.mockResolvedValue(mockIncomeType);

      const result = await FamilyIncomeResolvers.type(mockParent, {}, mockContext);

      expect(result).toEqual(mockIncomeType);
      expect(mockContext.loaders.incomeTypeLoader.load).toHaveBeenCalledWith(
        mockParent.typeId.toString()
      );
    });

    it("should handle missing income type", async () => {
      mockContext.loaders.incomeTypeLoader.load.mockResolvedValue(null);

      await expect(
        FamilyIncomeResolvers.type(mockParent, {}, mockContext)
      ).rejects.toThrow("Failed to retrieve IncomeType. Please try again later.");

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.typeId },
        "IncomeType not found"
      );
    });

    it("should handle loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.incomeTypeLoader.load.mockRejectedValue(loaderError);

      await expect(
        FamilyIncomeResolvers.type(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve IncomeType. Please try again later.", {
          extensions: {
            code: ERROR_CODES.GET_INCOME_TYPE_ERROR,
            detailedMessage: loaderError.message,
          },
        })
      );

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.typeId },
        "Error retrieving IncomeType"
      );
    });

    it("should preserve original error code when available", async () => {
      const loaderError = new GraphQLError("Custom error", {
        extensions: { code: "CUSTOM_ERROR_CODE" },
      });
      mockContext.loaders.incomeTypeLoader.load.mockRejectedValue(loaderError);

      await expect(
        FamilyIncomeResolvers.type(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve IncomeType. Please try again later.", {
          extensions: {
            code: "CUSTOM_ERROR_CODE",
            detailedMessage: loaderError.message,
          },
        })
      );
    });
  });

  describe("contributor resolver", () => {
    it("should load user successfully", async () => {
      const mockUser = {
        _id: mockParent.contributorId,
        firstName: "John",
        lastName: "Doe",
      };

      mockContext.loaders.userLoader.load.mockResolvedValue(mockUser);

      const result = await FamilyIncomeResolvers.contributor(mockParent, {}, mockContext);

      expect(result).toEqual(mockUser);
      expect(mockContext.loaders.userLoader.load).toHaveBeenCalledWith(
        mockParent.contributorId.toString()
      );
    });

    it("should handle missing user", async () => {
      mockContext.loaders.userLoader.load.mockResolvedValue(null);

      await expect(
        FamilyIncomeResolvers.contributor(mockParent, {}, mockContext)
      ).rejects.toThrow("Failed to retrieve user. Please try again later.");

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.contributorId },
        "User not found"
      );
    });

    it("should handle loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.userLoader.load.mockRejectedValue(loaderError);

      await expect(
        FamilyIncomeResolvers.contributor(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve user. Please try again later.", {
          extensions: {
            code: ERROR_CODES.GET_USER_ERROR,
            detailedMessage: loaderError.message,
          },
        })
      );

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.contributorId },
        "Error retrieving User"
      );
    });

    it("should preserve original error code when available", async () => {
      const loaderError = new GraphQLError("Custom error", {
        extensions: { code: "CUSTOM_ERROR_CODE" },
      });
      mockContext.loaders.userLoader.load.mockRejectedValue(loaderError);

      await expect(
        FamilyIncomeResolvers.contributor(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve user. Please try again later.", {
          extensions: {
            code: "CUSTOM_ERROR_CODE",
            detailedMessage: loaderError.message,
          },
        })
      );
    });
  });

  describe("currency resolver", () => {
    it("should load currency successfully", async () => {
      const mockCurrency = {
        _id: mockParent.currencyId,
        name: "USD",
        symbol: "$",
        code: "USD",
      };

      mockContext.loaders.currencyLoader.load.mockResolvedValue(mockCurrency);

      const result = await FamilyIncomeResolvers.currency(mockParent, {}, mockContext);

      expect(result).toEqual(mockCurrency);
      expect(mockContext.loaders.currencyLoader.load).toHaveBeenCalledWith(
        mockParent.currencyId.toString()
      );
    });

    it("should handle missing currency", async () => {
      mockContext.loaders.currencyLoader.load.mockResolvedValue(null);

      await expect(
        FamilyIncomeResolvers.currency(mockParent, {}, mockContext)
      ).rejects.toThrow("Failed to retrieve Currency. Please try again later.");

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.currencyId },
        "Currency not found"
      );
    });

    it("should handle loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.currencyLoader.load.mockRejectedValue(loaderError);

      await expect(
        FamilyIncomeResolvers.currency(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve Currency. Please try again later.", {
          extensions: {
            code: ERROR_CODES.GET_CURRENCY_ERROR,
            detailedMessage: loaderError.message,
          },
        })
      );

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.currencyId },
        "Error retrieving Currency"
      );
    });

    it("should preserve original error code when available", async () => {
      const loaderError = new GraphQLError("Custom error", {
        extensions: { code: "CUSTOM_ERROR_CODE" },
      });
      mockContext.loaders.currencyLoader.load.mockRejectedValue(loaderError);

      await expect(
        FamilyIncomeResolvers.currency(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve Currency. Please try again later.", {
          extensions: {
            code: "CUSTOM_ERROR_CODE",
            detailedMessage: loaderError.message,
          },
        })
      );
    });
  });
}); 