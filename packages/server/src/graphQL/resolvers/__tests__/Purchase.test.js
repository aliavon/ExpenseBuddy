const PurchaseResolvers = require("../Purchase");
const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

describe("Purchase resolvers", () => {
  let mockContext;
  let mockParent;

  beforeEach(() => {
    mockContext = global.createMockContext();
    mockParent = {
      itemId: global.createMockId(),
    };
  });

  describe("item resolver", () => {
    it("should load item successfully", async () => {
      const mockItem = {
        _id: mockParent.itemId,
        name: "Apple",
        category: "Fruits",
      };

      mockContext.loaders.itemLoader.load.mockResolvedValue(mockItem);

      const result = await PurchaseResolvers.item(mockParent, {}, mockContext);

      expect(result).toEqual(mockItem);
      expect(mockContext.loaders.itemLoader.load).toHaveBeenCalledWith(mockParent.itemId);
    });

    it("should handle missing item", async () => {
      mockContext.loaders.itemLoader.load.mockResolvedValue(null);

      await expect(
        PurchaseResolvers.item(mockParent, {}, mockContext)
      ).rejects.toThrow("Failed to retrieve item. Please try again later.");

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { parentId: mockParent.itemId },
        "Item not found"
      );
    });

    it("should handle loader errors", async () => {
      const loaderError = new Error("Database connection failed");
      mockContext.loaders.itemLoader.load.mockRejectedValue(loaderError);

      await expect(
        PurchaseResolvers.item(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve item. Please try again later.", {
          extensions: {
            code: ERROR_CODES.GET_ITEM_ERROR,
            detailedMessage: loaderError.message,
          },
        })
      );

      expect(mockContext.logger.error).toHaveBeenCalledWith(
        { err: loaderError, parentId: mockParent.itemId },
        "Error retrieving item"
      );
    });

    it("should preserve original error code when available", async () => {
      const loaderError = new GraphQLError("Custom error", {
        extensions: { code: "CUSTOM_ERROR_CODE" },
      });
      mockContext.loaders.itemLoader.load.mockRejectedValue(loaderError);

      await expect(
        PurchaseResolvers.item(mockParent, {}, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to retrieve item. Please try again later.", {
          extensions: {
            code: "CUSTOM_ERROR_CODE",
            detailedMessage: loaderError.message,
          },
        })
      );
    });

    it("should handle non-string itemId", async () => {
      const mockItem = {
        _id: mockParent.itemId,
        name: "Apple",
        category: "Fruits",
      };

      // Test with ObjectId instead of string
      mockParent.itemId = global.createMockId();
      mockContext.loaders.itemLoader.load.mockResolvedValue(mockItem);

      const result = await PurchaseResolvers.item(mockParent, {}, mockContext);

      expect(result).toEqual(mockItem);
      expect(mockContext.loaders.itemLoader.load).toHaveBeenCalledWith(mockParent.itemId);
    });

    it("should handle null itemId", async () => {
      mockParent.itemId = null;
      mockContext.loaders.itemLoader.load.mockResolvedValue(null);

      await expect(
        PurchaseResolvers.item(mockParent, {}, mockContext)
      ).rejects.toThrow("Failed to retrieve item. Please try again later.");

      expect(mockContext.loaders.itemLoader.load).toHaveBeenCalledWith(null);
    });
  });
}); 