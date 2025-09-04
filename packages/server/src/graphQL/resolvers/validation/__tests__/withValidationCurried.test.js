const withValidationCurried = require("../withValidationCurried");
const Joi = require("joi");

describe("withValidationCurried", () => {
  const mockSchema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().min(0).required(),
  });

  const mockResolver = jest.fn().mockResolvedValue("resolver result");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a function that accepts a resolver", () => {
    const curriedFunction = withValidationCurried(mockSchema);
    expect(typeof curriedFunction).toBe("function");
  });

  it("should return a validated resolver function", () => {
    const curriedFunction = withValidationCurried(mockSchema);
    const validatedResolver = curriedFunction(mockResolver);
    expect(typeof validatedResolver).toBe("function");
  });

  it("should call the original resolver with valid input", async () => {
    const validatedResolver = withValidationCurried(mockSchema)(mockResolver);
    const validArgs = { name: "John", age: 25 };
    const mockInfo = {};
    const mockContext = global.createMockContext();

    await validatedResolver(null, validArgs, mockContext, mockInfo);

    expect(mockResolver).toHaveBeenCalledWith(
      null,
      validArgs,
      mockContext,
      mockInfo
    );
  });

  it("should throw validation error with invalid input", async () => {
    const validatedResolver = withValidationCurried(mockSchema)(mockResolver);
    const invalidArgs = { name: "", age: -1 };
    const mockInfo = {};
    const mockContext = global.createMockContext();

    await expect(
      validatedResolver(null, invalidArgs, mockContext, mockInfo)
    ).rejects.toThrow();

    expect(mockResolver).not.toHaveBeenCalled();
  });

  it("should pass through the resolver result", async () => {
    const validatedResolver = withValidationCurried(mockSchema)(mockResolver);
    const validArgs = { name: "John", age: 25 };
    const mockInfo = {};
    const mockContext = global.createMockContext();

    const result = await validatedResolver(
      null,
      validArgs,
      mockContext,
      mockInfo
    );

    expect(result).toBe("resolver result");
  });

  it("should work with different schemas", async () => {
    const differentSchema = Joi.object({
      email: Joi.string().email().required(),
    });

    const validatedResolver =
      withValidationCurried(differentSchema)(mockResolver);
    const validArgs = { email: "test@example.com" };
    const mockInfo = {};
    const mockContext = global.createMockContext();

    await validatedResolver(null, validArgs, mockContext, mockInfo);

    expect(mockResolver).toHaveBeenCalledWith(
      null,
      validArgs,
      mockContext,
      mockInfo
    );
  });

  it("should handle resolver errors", async () => {
    const errorResolver = jest
      .fn()
      .mockRejectedValue(new Error("Resolver error"));
    const validatedResolver = withValidationCurried(mockSchema)(errorResolver);
    const validArgs = { name: "John", age: 25 };
    const mockInfo = {};
    const mockContext = global.createMockContext();

    await expect(
      validatedResolver(null, validArgs, mockContext, mockInfo)
    ).rejects.toThrow("Resolver error");
  });
});
