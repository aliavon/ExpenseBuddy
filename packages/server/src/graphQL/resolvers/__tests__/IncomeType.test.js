const IncomeTypeResolver = require("../IncomeType");

describe("IncomeType Resolver", () => {
  describe("id resolver", () => {
    it("should return incomeType.id when available", () => {
      const incomeType = { id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return incomeType._id when id is not available", () => {
      const incomeType = { _id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return incomeType.id when both id and _id are available", () => {
      const incomeType = {
        id: "507f1f77bcf86cd799439011",
        _id: "different_id",
      };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return undefined when neither id nor _id are available", () => {
      const incomeType = {};
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBeUndefined();
    });

    it("should return _id when id is null", () => {
      const incomeType = { id: null, _id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return _id when id is empty string", () => {
      const incomeType = { id: "", _id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return _id when id is undefined", () => {
      const incomeType = { id: undefined, _id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return _id when id is 0", () => {
      const incomeType = { id: 0, _id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return _id when id is false", () => {
      const incomeType = { id: false, _id: "507f1f77bcf86cd799439011" };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBe("507f1f77bcf86cd799439011");
    });

    it("should return null when _id is null and id is not available", () => {
      const incomeType = { _id: null };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toBeNull();
    });

    it("should handle ObjectId-like objects", () => {
      const incomeType = {
        _id: { toString: () => "507f1f77bcf86cd799439011" },
      };
      const result = IncomeTypeResolver.id(incomeType);
      expect(result).toEqual(
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );
    });

    it("should prioritize id over _id when id is truthy", () => {
      const testCases = [
        {
          incomeType: { id: "id1", _id: "id2" },
          expected: "id1",
        },
        {
          incomeType: { id: "test", _id: "id2" },
          expected: "test",
        },
        {
          incomeType: { id: 123, _id: "id2" },
          expected: 123,
        },
      ];

      testCases.forEach(({ incomeType, expected }) => {
        expect(IncomeTypeResolver.id(incomeType)).toBe(expected);
      });
    });

    it("should fallback to _id when id is falsy", () => {
      const testCases = [
        { incomeType: { id: null, _id: "id2" }, expected: "id2" },
        { incomeType: { id: "", _id: "id2" }, expected: "id2" },
        { incomeType: { id: 0, _id: "id2" }, expected: "id2" },
        { incomeType: { id: false, _id: "id2" }, expected: "id2" },
        { incomeType: { id: undefined, _id: "id2" }, expected: "id2" },
      ];

      testCases.forEach(({ incomeType, expected }) => {
        expect(IncomeTypeResolver.id(incomeType)).toBe(expected);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty incomeType object", () => {
      const incomeType = {};
      expect(IncomeTypeResolver.id(incomeType)).toBeUndefined();
    });

    it("should handle incomeType with all properties", () => {
      const incomeType = {
        id: "income-type-123",
        _id: "mongo_id",
        name: "Salary",
        description: "Monthly salary income",
      };

      expect(IncomeTypeResolver.id(incomeType)).toBe("income-type-123");
    });

    it("should handle incomeType with mixed data types", () => {
      const incomeType = {
        id: "income-type-123",
        name: "Salary",
      };

      expect(IncomeTypeResolver.id(incomeType)).toBe("income-type-123");
    });
  });
});
