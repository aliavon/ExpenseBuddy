const errorHandlingIndex = require("../index");
const withErrorHandling = require("../withErrorHandling");
const withErrorHandlingCurried = require("../withErrorHandlingCurried");
const defaultHandlerArgs = require("../constants");

describe("Error Handling Index", () => {
  it("should export all required modules", () => {
    expect(errorHandlingIndex).toHaveProperty("withErrorHandling");
    expect(errorHandlingIndex).toHaveProperty("withErrorHandlingCurried");
    expect(errorHandlingIndex).toHaveProperty("defaultHandlerArgs");
  });

  it("should export the correct withErrorHandling function", () => {
    expect(errorHandlingIndex.withErrorHandling).toBe(withErrorHandling);
    expect(typeof errorHandlingIndex.withErrorHandling).toBe("function");
  });

  it("should export the correct withErrorHandlingCurried function", () => {
    expect(errorHandlingIndex.withErrorHandlingCurried).toBe(withErrorHandlingCurried);
    expect(typeof errorHandlingIndex.withErrorHandlingCurried).toBe("function");
  });

  it("should export the correct defaultHandlerArgs constants", () => {
    expect(errorHandlingIndex.defaultHandlerArgs).toBe(defaultHandlerArgs);
    expect(typeof errorHandlingIndex.defaultHandlerArgs).toBe("object");
  });

  it("should have exactly 3 exports", () => {
    const exportKeys = Object.keys(errorHandlingIndex);
    expect(exportKeys).toHaveLength(3);
  });

  it("should not export any undefined values", () => {
    Object.values(errorHandlingIndex).forEach(exportedValue => {
      expect(exportedValue).toBeDefined();
    });
  });

  it("should maintain consistent export structure", () => {
    expect(errorHandlingIndex).toEqual({
      withErrorHandling,
      withErrorHandlingCurried,
      defaultHandlerArgs,
    });
  });
}); 