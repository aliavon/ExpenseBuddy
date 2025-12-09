const FamilyIncomeResolvers = require("../FamilyIncome");

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

      mockContext.loaders.incomeTypeLoader.load.mockResolvedValue(
        mockIncomeType
      );

      const result = await FamilyIncomeResolvers.type(
        mockParent,
        {},
        mockContext
      );

      expect(result).toEqual(mockIncomeType);
      expect(mockContext.loaders.incomeTypeLoader.load).toHaveBeenCalledWith(
        mockParent.typeId.toString()
      );
    });

    it("should return null when typeId is not set", async () => {
      const parentWithoutType = { ...mockParent, typeId: null };

      const result = await FamilyIncomeResolvers.type(
        parentWithoutType,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.loaders.incomeTypeLoader.load).not.toHaveBeenCalled();
    });

    it("should return null when income type not found", async () => {
      mockContext.loaders.incomeTypeLoader.load.mockResolvedValue(null);

      const result = await FamilyIncomeResolvers.type(
        mockParent,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.typeId },
        "IncomeType not found"
      );
    });

    it("should return null on loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.incomeTypeLoader.load.mockRejectedValue(loaderError);

      const result = await FamilyIncomeResolvers.type(
        mockParent,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.typeId },
        "Error retrieving IncomeType"
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

      const result = await FamilyIncomeResolvers.contributor(
        mockParent,
        {},
        mockContext
      );

      expect(result).toEqual(mockUser);
      expect(mockContext.loaders.userLoader.load).toHaveBeenCalledWith(
        mockParent.contributorId.toString()
      );
    });

    it("should return null when contributorId is not set", async () => {
      const parentWithoutContributor = { ...mockParent, contributorId: null };

      const result = await FamilyIncomeResolvers.contributor(
        parentWithoutContributor,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.loaders.userLoader.load).not.toHaveBeenCalled();
    });

    it("should return null when user not found", async () => {
      mockContext.loaders.userLoader.load.mockResolvedValue(null);

      const result = await FamilyIncomeResolvers.contributor(
        mockParent,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.contributorId },
        "User not found"
      );
    });

    it("should return null on loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.userLoader.load.mockRejectedValue(loaderError);

      const result = await FamilyIncomeResolvers.contributor(
        mockParent,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.contributorId },
        "Error retrieving User"
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

      const result = await FamilyIncomeResolvers.currency(
        mockParent,
        {},
        mockContext
      );

      expect(result).toEqual(mockCurrency);
      expect(mockContext.loaders.currencyLoader.load).toHaveBeenCalledWith(
        mockParent.currencyId.toString()
      );
    });

    it("should return null when currencyId is not set", async () => {
      const parentWithoutCurrency = { ...mockParent, currencyId: null };

      const result = await FamilyIncomeResolvers.currency(
        parentWithoutCurrency,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.loaders.currencyLoader.load).not.toHaveBeenCalled();
    });

    it("should return null when currency not found", async () => {
      mockContext.loaders.currencyLoader.load.mockResolvedValue(null);

      const result = await FamilyIncomeResolvers.currency(
        mockParent,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.currencyId },
        "Currency not found"
      );
    });

    it("should return null on loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.currencyLoader.load.mockRejectedValue(loaderError);

      const result = await FamilyIncomeResolvers.currency(
        mockParent,
        {},
        mockContext
      );

      expect(result).toBeNull();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.currencyId },
        "Error retrieving Currency"
      );
    });
  });

  describe("date resolver", () => {
    it("should convert Date object to ISO string", async () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      const parent = { ...mockParent, date };

      const result = FamilyIncomeResolvers.date(parent);

      expect(result).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should convert timestamp number to ISO string", async () => {
      const timestamp = new Date("2024-01-15T10:30:00.000Z").getTime();
      const parent = { ...mockParent, date: timestamp };

      const result = FamilyIncomeResolvers.date(parent);

      expect(result).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should convert timestamp string to ISO string", async () => {
      const timestamp = new Date("2024-01-15T10:30:00.000Z")
        .getTime()
        .toString();
      const parent = { ...mockParent, date: timestamp };

      const result = FamilyIncomeResolvers.date(parent);

      expect(result).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should return ISO string as is", async () => {
      const isoString = "2024-01-15T10:30:00.000Z";
      const parent = { ...mockParent, date: isoString };

      const result = FamilyIncomeResolvers.date(parent);

      expect(result).toBe(isoString);
    });
  });

  describe("id resolver", () => {
    it("should return id when available", () => {
      const parent = { id: "test-id", _id: "mongodb-id" };

      const result = FamilyIncomeResolvers.id(parent);

      expect(result).toBe("test-id");
    });

    it("should return _id when id is not available", () => {
      const parent = { _id: "mongodb-id" };

      const result = FamilyIncomeResolvers.id(parent);

      expect(result).toBe("mongodb-id");
    });
  });
});
