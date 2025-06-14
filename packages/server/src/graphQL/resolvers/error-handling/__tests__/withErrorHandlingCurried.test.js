const withErrorHandlingCurried = require("../withErrorHandlingCurried");
const withErrorHandling = require("../withErrorHandling");

// Mock the withErrorHandling module
jest.mock("../withErrorHandling");

describe("withErrorHandlingCurried", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a function that accepts a resolver", () => {
    const options = {
      defaultErrorCode: "TEST_ERROR",
      defaultErrorMessage: "Test error message",
    };

    const curriedFunction = withErrorHandlingCurried(options);

    expect(typeof curriedFunction).toBe("function");
  });

  it("should call withErrorHandling with resolver and options", () => {
    const mockResolver = jest.fn();
    const options = {
      defaultErrorCode: "TEST_ERROR",
      defaultErrorMessage: "Test error message",
    };
    const mockWrappedResolver = jest.fn();

    withErrorHandling.mockReturnValue(mockWrappedResolver);

    const curriedFunction = withErrorHandlingCurried(options);
    const result = curriedFunction(mockResolver);

    expect(withErrorHandling).toHaveBeenCalledWith(mockResolver, options);
    expect(result).toBe(mockWrappedResolver);
  });

  it("should work with empty options", () => {
    const mockResolver = jest.fn();
    const mockWrappedResolver = jest.fn();

    withErrorHandling.mockReturnValue(mockWrappedResolver);

    const curriedFunction = withErrorHandlingCurried({});
    const result = curriedFunction(mockResolver);

    expect(withErrorHandling).toHaveBeenCalledWith(mockResolver, {});
    expect(result).toBe(mockWrappedResolver);
  });

  it("should work without options", () => {
    const mockResolver = jest.fn();
    const mockWrappedResolver = jest.fn();

    withErrorHandling.mockReturnValue(mockWrappedResolver);

    const curriedFunction = withErrorHandlingCurried();
    const result = curriedFunction(mockResolver);

    expect(withErrorHandling).toHaveBeenCalledWith(mockResolver, undefined);
    expect(result).toBe(mockWrappedResolver);
  });

  it("should support functional composition", () => {
    const mockResolver = jest.fn();
    const options = {
      defaultErrorCode: "COMPOSITION_ERROR",
      defaultErrorMessage: "Composition test",
    };
    const mockWrappedResolver = jest.fn();

    withErrorHandling.mockReturnValue(mockWrappedResolver);

    // Test functional composition style
    const wrappedResolver = withErrorHandlingCurried(options)(mockResolver);

    expect(withErrorHandling).toHaveBeenCalledWith(mockResolver, options);
    expect(wrappedResolver).toBe(mockWrappedResolver);
  });
}); 