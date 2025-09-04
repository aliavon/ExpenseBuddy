const getFamilyIncomeRecordsSchema = require("../getFamilyIncomeRecordsSchema");

describe("getFamilyIncomeRecordsSchema validation", () => {
  const validObjectId = "507f1f77bcf86cd799439011";

  it("should validate with all required fields", () => {
    const validInput = {
      pagination: {
        page: 1,
        limit: 10,
      },
    };

    const { error } = getFamilyIncomeRecordsSchema.validate(validInput);
    expect(error).toBeUndefined();
  });

  it("should validate with all optional fields", () => {
    const validInput = {
      filters: {
        dateFrom: "2024-01-01T00:00:00.000Z",
        dateTo: "2024-12-31T23:59:59.999Z",
        contributorId: validObjectId,
        typeId: validObjectId,
      },
      pagination: {
        page: 2,
        limit: 20,
      },
      sort: {
        sortBy: "date",
        sortOrder: "desc",
      },
    };

    const { error } = getFamilyIncomeRecordsSchema.validate(validInput);
    expect(error).toBeUndefined();
  });

  it("should validate without filters", () => {
    const validInput = {
      pagination: {
        page: 1,
        limit: 5,
      },
    };

    const { error } = getFamilyIncomeRecordsSchema.validate(validInput);
    expect(error).toBeUndefined();
  });

  it("should validate without sort", () => {
    const validInput = {
      filters: {
        dateFrom: "2024-01-01T00:00:00.000Z",
      },
      pagination: {
        page: 1,
        limit: 10,
      },
    };

    const { error } = getFamilyIncomeRecordsSchema.validate(validInput);
    expect(error).toBeUndefined();
  });

  it("should validate with partial filters", () => {
    const validInput = {
      filters: {
        contributorId: validObjectId,
      },
      pagination: {
        page: 1,
        limit: 15,
      },
    };

    const { error } = getFamilyIncomeRecordsSchema.validate(validInput);
    expect(error).toBeUndefined();
  });

  it("should validate with both sort orders", () => {
    const validInputAsc = {
      pagination: { page: 1, limit: 10 },
      sort: { sortOrder: "asc" },
    };

    const validInputDesc = {
      pagination: { page: 1, limit: 10 },
      sort: { sortOrder: "desc" },
    };

    expect(
      getFamilyIncomeRecordsSchema.validate(validInputAsc).error
    ).toBeUndefined();
    expect(
      getFamilyIncomeRecordsSchema.validate(validInputDesc).error
    ).toBeUndefined();
  });

  describe("pagination validation", () => {
    it("should fail when pagination is missing", () => {
      const invalidInput = {
        filters: {
          dateFrom: "2024-01-01T00:00:00.000Z",
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"pagination" is required');
    });

    it("should fail when page is missing", () => {
      const invalidInput = {
        pagination: {
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"page" is required');
    });

    it("should fail when limit is missing", () => {
      const invalidInput = {
        pagination: {
          page: 1,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"limit" is required');
    });

    it("should fail when page is less than 1", () => {
      const invalidInput = {
        pagination: {
          page: 0,
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"page" must be at least 1');
    });

    it("should fail when limit is less than 1", () => {
      const invalidInput = {
        pagination: {
          page: 1,
          limit: 0,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"limit" must be at least 1');
    });

    it("should fail when page is not an integer", () => {
      const invalidInput = {
        pagination: {
          page: 1.5,
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"page" must be an integer');
    });
  });

  describe("filters validation", () => {
    it("should fail when dateFrom is invalid", () => {
      const invalidInput = {
        filters: {
          dateFrom: "invalid-date",
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"dateFrom" must be a valid ISO date'
      );
    });

    it("should fail when dateTo is invalid", () => {
      const invalidInput = {
        filters: {
          dateTo: "invalid-date",
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"dateTo" must be a valid ISO date'
      );
    });

    it("should fail when contributorId is invalid ObjectId", () => {
      const invalidInput = {
        filters: {
          contributorId: "invalid-id",
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"contributorId" must be a valid ObjectId'
      );
    });

    it("should fail when typeId is invalid ObjectId", () => {
      const invalidInput = {
        filters: {
          typeId: "invalid-id",
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"typeId" must be a valid ObjectId'
      );
    });
  });

  describe("sort validation", () => {
    it("should fail when sortOrder is invalid", () => {
      const invalidInput = {
        pagination: {
          page: 1,
          limit: 10,
        },
        sort: {
          sortOrder: "invalid",
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"sortOrder" must be one of [asc, desc]'
      );
    });

    it("should fail when sortBy is not a string", () => {
      const invalidInput = {
        pagination: {
          page: 1,
          limit: 10,
        },
        sort: {
          sortBy: 123,
        },
      };

      const { error } = getFamilyIncomeRecordsSchema.validate(invalidInput);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"sortBy" must be a string');
    });
  });
});
