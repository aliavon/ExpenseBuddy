const { GraphQLError } = require("graphql");
const withErrorHandling = require("../withErrorHandling");
const ERROR_CODES = require("../../../../constants/errorCodes");

describe("withErrorHandling", () => {
  const mockContext = {
    logger: {
      error: jest.fn(),
    },
  };

  const mockInfo = {
    parentType: "Query",
    fieldName: "testField",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return result when resolver succeeds", async () => {
    const mockResolver = jest.fn().mockResolvedValue("success");
    const wrappedResolver = withErrorHandling(mockResolver);

    const result = await wrappedResolver(null, {}, mockContext, mockInfo);

    expect(result).toBe("success");
    expect(mockResolver).toHaveBeenCalledWith(null, {}, mockContext, mockInfo);
    expect(mockContext.logger.error).not.toHaveBeenCalled();
  });

  it("should rethrow GraphQLError with existing error code", async () => {
    const originalError = new GraphQLError("Custom error", {
      extensions: { code: "CUSTOM_ERROR" },
    });
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const wrappedResolver = withErrorHandling(mockResolver);

    await expect(
      wrappedResolver(null, {}, mockContext, mockInfo)
    ).rejects.toThrow(originalError);

    expect(mockContext.logger.error).toHaveBeenCalledWith(
      {
        err: originalError,
        code: "CUSTOM_ERROR",
        message: "Custom error",
      },
      'Error in resolver "Query" for field "testField"'
    );
  });

  it("should wrap error with default options when no options provided", async () => {
    const originalError = new Error("Database connection failed");
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const wrappedResolver = withErrorHandling(mockResolver);

    await expect(
      wrappedResolver(null, {}, mockContext, mockInfo)
    ).rejects.toThrow(GraphQLError);

    try {
      await wrappedResolver(null, {}, mockContext, mockInfo);
    } catch (error) {
      expect(error.message).toBe("An error occurred");
      expect(error.extensions.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
      expect(error.extensions.detailedMessage).toBe(
        "Database connection failed"
      );
    }

    expect(mockContext.logger.error).toHaveBeenCalledWith(
      {
        err: originalError,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "Database connection failed",
      },
      'Error in resolver "Query" for field "testField"'
    );
  });

  it("should use provided default error code and message", async () => {
    const originalError = new Error("Validation failed");
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const options = {
      defaultErrorCode: "VALIDATION_ERROR",
      defaultErrorMessage: "Input validation failed",
    };
    const wrappedResolver = withErrorHandling(mockResolver, options);

    await expect(
      wrappedResolver(null, {}, mockContext, mockInfo)
    ).rejects.toThrow(GraphQLError);

    try {
      await wrappedResolver(null, {}, mockContext, mockInfo);
    } catch (error) {
      expect(error.message).toBe("Input validation failed");
      expect(error.extensions.code).toBe("VALIDATION_ERROR");
      expect(error.extensions.detailedMessage).toBe("Validation failed");
    }
  });

  it("should handle error without message", async () => {
    const originalError = new Error();
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const wrappedResolver = withErrorHandling(mockResolver);

    await expect(
      wrappedResolver(null, {}, mockContext, mockInfo)
    ).rejects.toThrow(GraphQLError);

    try {
      await wrappedResolver(null, {}, mockContext, mockInfo);
    } catch (error) {
      expect(error.message).toBe("An error occurred");
      expect(error.extensions.detailedMessage).toBe("");
    }
  });

  it("should handle context without logger", async () => {
    const originalError = new Error("Test error");
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const wrappedResolver = withErrorHandling(mockResolver);
    const contextWithoutLogger = {};

    await expect(
      wrappedResolver(null, {}, contextWithoutLogger, mockInfo)
    ).rejects.toThrow(GraphQLError);

    // Should not throw error when logger is not available
  });

  it("should handle null/undefined error properties gracefully", async () => {
    const originalError = null;
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const wrappedResolver = withErrorHandling(mockResolver);

    await expect(
      wrappedResolver(null, {}, mockContext, mockInfo)
    ).rejects.toThrow(GraphQLError);

    try {
      await wrappedResolver(null, {}, mockContext, mockInfo);
    } catch (error) {
      expect(error.message).toBe("An error occurred");
      expect(error.extensions.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  });

  it("should use default message when error message is empty", async () => {
    const originalError = new Error("");
    const mockResolver = jest.fn().mockRejectedValue(originalError);
    const options = {
      defaultErrorMessage: "Custom default message",
    };
    const wrappedResolver = withErrorHandling(mockResolver, options);

    try {
      await wrappedResolver(null, {}, mockContext, mockInfo);
    } catch (error) {
      expect(error.message).toBe("Custom default message");
    }
  });

  it("should preserve async resolver behavior", async () => {
    const mockResolver = jest.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "async result";
    });
    const wrappedResolver = withErrorHandling(mockResolver);

    const result = await wrappedResolver(null, {}, mockContext, mockInfo);

    expect(result).toBe("async result");
  });
});
