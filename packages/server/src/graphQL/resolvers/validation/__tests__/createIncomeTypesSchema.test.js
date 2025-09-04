const createIncomeTypesSchema = require("../createIncomeTypesSchema");

describe("createIncomeTypesSchema validation", () => {
  it("should validate valid income types data", () => {
    const validData = {
      incomeTypes: [
        {
          name: "Salary",
          description: "Monthly salary income",
        },
        {
          name: "Bonus",
          description: "Annual bonus",
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it("should validate income types without description", () => {
    const validData = {
      incomeTypes: [
        {
          name: "Freelance",
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it("should validate income types with empty description", () => {
    const validData = {
      incomeTypes: [
        {
          name: "Consulting",
          description: "",
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it("should fail validation when incomeTypes is missing", () => {
    const invalidData = {};

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('"incomeTypes" is required');
  });

  it("should fail validation when incomeTypes is not an array", () => {
    const invalidData = {
      incomeTypes: "not an array",
    };

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain(
      '"incomeTypes" must be an array'
    );
  });

  it("should fail validation when incomeTypes array is empty", () => {
    const invalidData = {
      incomeTypes: [],
    };

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain(
      '"incomeTypes" must contain at least one element'
    );
  });

  it("should fail validation when name is missing", () => {
    const invalidData = {
      incomeTypes: [
        {
          description: "Description without name",
        },
      ],
    };

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('"name" is required');
  });

  it("should fail validation when name is empty string", () => {
    const invalidData = {
      incomeTypes: [
        {
          name: "",
          description: "Some description",
        },
      ],
    };

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('"name" cannot be empty');
  });

  it("should fail validation when name is not a string", () => {
    const invalidData = {
      incomeTypes: [
        {
          name: 123,
          description: "Some description",
        },
      ],
    };

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('"name" must be a string');
  });

  it("should fail validation when description is not a string", () => {
    const invalidData = {
      incomeTypes: [
        {
          name: "Valid Name",
          description: 123,
        },
      ],
    };

    const { error } = createIncomeTypesSchema.validate(invalidData);

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain(
      '"description" must be a string'
    );
  });

  it("should validate multiple income types with mixed valid data", () => {
    const validData = {
      incomeTypes: [
        {
          name: "Salary",
          description: "Regular monthly salary",
        },
        {
          name: "Freelance",
        },
        {
          name: "Investment",
          description: "",
        },
        {
          name: "Rental Income",
          description: "Income from property rental",
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it("should collect multiple validation errors", () => {
    const invalidData = {
      incomeTypes: [
        {
          name: "",
          description: 123,
        },
        {
          description: "Missing name",
        },
      ],
    };

    const { error } = createIncomeTypesSchema.validate(invalidData, {
      abortEarly: false,
    });

    expect(error).toBeDefined();
    expect(error.details).toHaveLength(3); // Empty name, wrong description type, missing name

    const messages = error.details.map((detail) => detail.message);
    expect(messages).toContain('"name" cannot be empty');
    expect(messages).toContain('"description" must be a string');
    expect(messages).toContain('"name" is required');
  });

  it("should handle special characters in name and description", () => {
    const validData = {
      incomeTypes: [
        {
          name: "Freelance & Consulting",
          description: "Income from freelance work & consulting services",
        },
        {
          name: "投資収益",
          description: "Investment returns in Japanese",
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it("should validate single character name", () => {
    const validData = {
      incomeTypes: [
        {
          name: "A",
          description: "Single character name",
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it("should validate very long names and descriptions", () => {
    const longName = "A".repeat(1000);
    const longDescription = "B".repeat(2000);

    const validData = {
      incomeTypes: [
        {
          name: longName,
          description: longDescription,
        },
      ],
    };

    const { error, value } = createIncomeTypesSchema.validate(validData);

    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });
});
