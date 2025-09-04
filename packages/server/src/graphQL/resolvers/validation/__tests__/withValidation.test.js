const withValidation = require("../withValidation");
const Joi = require("joi");
const { GraphQLError } = require("graphql");

describe("withValidation", () => {
  const mockResolver = jest.fn().mockResolvedValue("success");
  const mockContext = createMockContext();
  const mockInfo = {
    parentType: "Query",
    fieldName: "testField",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call resolver with validated args when validation passes", async () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const args = { name: "John", age: 25 };

    const result = await wrappedResolver(null, args, mockContext, mockInfo);

    expect(result).toBe("success");
    expect(mockResolver).toHaveBeenCalledWith(
      null,
      args,
      mockContext,
      mockInfo
    );
    expect(mockResolver).toHaveBeenCalledTimes(1);
  });

  it("should throw GraphQLError when validation fails", async () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0).required(),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const args = { name: "", age: -5 };

    await expect(
      wrappedResolver(null, args, mockContext, mockInfo)
    ).rejects.toThrow(GraphQLError);
    expect(mockResolver).not.toHaveBeenCalled();
  });

  it("should include detailed validation messages in error", async () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      count: Joi.number().min(1).required(),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const args = { email: "invalid-email", count: 0 };

    try {
      await wrappedResolver(null, args, mockContext, mockInfo);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.message).toContain("Validation error");
      expect(error.extensions.code).toBe("VALIDATION_ERROR");
      expect(error.extensions.detailedMessage).toBeDefined();
      expect(error.extensions.detailedMessage).toContain("email");
      expect(error.extensions.detailedMessage).toContain("count");
    }
  });

  it("should log validation errors when logger is available", async () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const args = {};

    try {
      await wrappedResolver(null, args, mockContext, mockInfo);
    } catch (error) {
      // Expected to throw
    }

    expect(mockContext.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        validationErrors: expect.any(Array),
      }),
      expect.stringContaining(
        'Validation error in resolver "Query" for field "testField"'
      )
    );
  });

  it("should handle context without logger gracefully", async () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const contextWithoutLogger = { ...mockContext, logger: undefined };
    const wrappedResolver = withValidation(schema, mockResolver);
    const args = {};

    await expect(
      wrappedResolver(null, args, contextWithoutLogger, mockInfo)
    ).rejects.toThrow(GraphQLError);
    expect(mockResolver).not.toHaveBeenCalled();
  });

  it("should validate complex nested objects", async () => {
    const schema = Joi.object({
      user: Joi.object({
        name: Joi.string().required(),
        address: Joi.object({
          street: Joi.string().required(),
          city: Joi.string().required(),
        }).required(),
      }).required(),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const validArgs = {
      user: {
        name: "John",
        address: {
          street: "123 Main St",
          city: "Anytown",
        },
      },
    };

    const result = await wrappedResolver(
      null,
      validArgs,
      mockContext,
      mockInfo
    );
    expect(result).toBe("success");
    expect(mockResolver).toHaveBeenCalledWith(
      null,
      validArgs,
      mockContext,
      mockInfo
    );
  });

  it("should validate arrays with items", async () => {
    const schema = Joi.object({
      items: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            price: Joi.number().positive().required(),
          })
        )
        .min(1)
        .required(),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const validArgs = {
      items: [
        { name: "Item 1", price: 10.5 },
        { name: "Item 2", price: 25.0 },
      ],
    };

    const result = await wrappedResolver(
      null,
      validArgs,
      mockContext,
      mockInfo
    );
    expect(result).toBe("success");
    expect(mockResolver).toHaveBeenCalledWith(
      null,
      validArgs,
      mockContext,
      mockInfo
    );
  });

  it("should handle validation with custom messages", async () => {
    const schema = Joi.object({
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required",
      }),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const args = { password: "123" };

    try {
      await wrappedResolver(null, args, mockContext, mockInfo);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error.extensions.detailedMessage).toContain(
        "Password must be at least 8 characters long"
      );
    }
  });

  it("should handle validation with abortEarly: false", async () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().min(0).required(),
    });

    const wrappedResolver = withValidation(schema, mockResolver);
    const args = {}; // All required fields missing

    try {
      await wrappedResolver(null, args, mockContext, mockInfo);
      fail("Should have thrown an error");
    } catch (error) {
      expect(error.extensions.detailedMessage).toContain("name");
      expect(error.extensions.detailedMessage).toContain("email");
      expect(error.extensions.detailedMessage).toContain("age");
    }
  });
});
