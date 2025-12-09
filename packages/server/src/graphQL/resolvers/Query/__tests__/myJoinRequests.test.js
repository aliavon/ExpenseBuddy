const { GraphQLError } = require("graphql");
const { myJoinRequestsResolver: myJoinRequests } = require("../myJoinRequests");
const { FamilyJoinRequest } = require("../../../../database/schemas");
const ERROR_CODES = require("../../../../constants/errorCodes");

// Mock dependencies
jest.mock("../../../../database/schemas");

describe("myJoinRequests", () => {
  let mockContext;
  let mockUser;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockUser = {
      _id: "user123",
      id: "user123",
      email: "user@example.com",
    };

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: mockUser,
      },
    };

    // Mock FamilyJoinRequest with chain
    FamilyJoinRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: "request1",
          userId: "user123",
          familyId: {
            _id: "family1",
            name: "Test Family",
            description: "A test family",
            isActive: true,
          },
          ownerId: {
            _id: "owner1",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          status: "PENDING",
          requestedAt: new Date("2024-01-15"),
          isActive: true,
        },
      ]),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("authentication", () => {
    it("should require authentication", async () => {
      await expect(myJoinRequests(null, {}, {})).rejects.toThrow(
        new GraphQLError("Authentication required", {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        })
      );
    });

    it("should require authenticated user", async () => {
      await expect(
        myJoinRequests(
          null,
          {},
          { auth: { isAuthenticated: false, user: mockUser } }
        )
      ).rejects.toThrow(
        new GraphQLError("Authentication required", {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        })
      );
    });

    it("should require user object", async () => {
      await expect(
        myJoinRequests(
          null,
          {},
          { auth: { isAuthenticated: true, user: null } }
        )
      ).rejects.toThrow(
        new GraphQLError("Authentication required", {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        })
      );
    });

    it("should require user object when auth is missing", async () => {
      await expect(myJoinRequests(null, {}, { auth: null })).rejects.toThrow(
        new GraphQLError("Authentication required", {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        })
      );
    });
  });

  describe("successful flow", () => {
    it("should return join requests successfully", async () => {
      const result = await myJoinRequests(null, {}, mockContext);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe("request1");
      expect(result[0].familyId.name).toBe("Test Family");
      expect(result[0].ownerId.firstName).toBe("John");
    });

    it("should query requests for authenticated user", async () => {
      await myJoinRequests(null, {}, mockContext);

      expect(FamilyJoinRequest.find).toHaveBeenCalledWith({
        userId: "user123",
        isActive: true,
      });
    });

    it("should populate familyId with specific fields", async () => {
      const mockChain = FamilyJoinRequest.find();

      await myJoinRequests(null, {}, mockContext);

      expect(mockChain.populate).toHaveBeenCalledWith(
        "familyId",
        "name description isActive"
      );
    });

    it("should populate ownerId with specific fields", async () => {
      const mockChain = FamilyJoinRequest.find();

      await myJoinRequests(null, {}, mockContext);

      expect(mockChain.populate).toHaveBeenCalledWith(
        "ownerId",
        "firstName lastName email"
      );
    });

    it("should sort by requestedAt descending (most recent first)", async () => {
      const mockChain = FamilyJoinRequest.find();

      await myJoinRequests(null, {}, mockContext);

      expect(mockChain.sort).toHaveBeenCalledWith({ requestedAt: -1 });
    });

    it("should use lean for better performance", async () => {
      const mockChain = FamilyJoinRequest.find();

      await myJoinRequests(null, {}, mockContext);

      expect(mockChain.lean).toHaveBeenCalled();
    });

    it("should return empty array when no requests found", async () => {
      FamilyJoinRequest.find().lean.mockResolvedValue([]);

      const result = await myJoinRequests(null, {}, mockContext);

      expect(result).toEqual([]);
    });

    it("should return multiple requests in correct order", async () => {
      const mockRequests = [
        {
          _id: "request1",
          userId: "user123",
          requestedAt: new Date("2024-01-20"),
          familyId: { _id: "family1", name: "Family 1" },
          ownerId: { _id: "owner1", firstName: "John" },
          isActive: true,
        },
        {
          _id: "request2",
          userId: "user123",
          requestedAt: new Date("2024-01-15"),
          familyId: { _id: "family2", name: "Family 2" },
          ownerId: { _id: "owner2", firstName: "Jane" },
          isActive: true,
        },
        {
          _id: "request3",
          userId: "user123",
          requestedAt: new Date("2024-01-25"),
          familyId: { _id: "family3", name: "Family 3" },
          ownerId: { _id: "owner3", firstName: "Bob" },
          isActive: true,
        },
      ];

      FamilyJoinRequest.find().lean.mockResolvedValue(mockRequests);

      const result = await myJoinRequests(null, {}, mockContext);

      expect(result).toHaveLength(3);
      expect(result[0]._id).toBe("request1");
      expect(result[1]._id).toBe("request2");
      expect(result[2]._id).toBe("request3");
    });
  });

  describe("error handling", () => {
    it("should handle database query errors", async () => {
      FamilyJoinRequest.find().lean.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(myJoinRequests(null, {}, mockContext)).rejects.toThrow(
        new GraphQLError("Failed to fetch join requests", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in myJoinRequests:",
        expect.any(Error)
      );
    });

    it("should handle populate errors", async () => {
      FamilyJoinRequest.find().populate.mockImplementation(() => {
        throw new Error("Populate failed");
      });

      await expect(myJoinRequests(null, {}, mockContext)).rejects.toThrow(
        new GraphQLError("Failed to fetch join requests", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle sort errors", async () => {
      FamilyJoinRequest.find()
        .populate()
        .sort.mockImplementation(() => {
          throw new Error("Sort failed");
        });

      await expect(myJoinRequests(null, {}, mockContext)).rejects.toThrow(
        new GraphQLError("Failed to fetch join requests", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle lean errors", async () => {
      FamilyJoinRequest.find().lean.mockRejectedValue(new Error("Lean failed"));

      await expect(myJoinRequests(null, {}, mockContext)).rejects.toThrow(
        new GraphQLError("Failed to fetch join requests", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle requests with null populated fields", async () => {
      const mockRequestsWithNulls = [
        {
          _id: "request1",
          userId: "user123",
          familyId: null,
          ownerId: null,
          isActive: true,
          requestedAt: new Date(),
        },
      ];

      FamilyJoinRequest.find().lean.mockResolvedValue(mockRequestsWithNulls);

      const result = await myJoinRequests(null, {}, mockContext);

      expect(result).toHaveLength(1);
      expect(result[0].familyId).toBeNull();
      expect(result[0].ownerId).toBeNull();
    });

    it("should handle requests with partial populated data", async () => {
      const mockRequests = [
        {
          _id: "request1",
          userId: "user123",
          familyId: { _id: "family1", name: "Family 1" },
          ownerId: { _id: "owner1" }, // Missing firstName, lastName, email
          isActive: true,
          requestedAt: new Date(),
        },
      ];

      FamilyJoinRequest.find().lean.mockResolvedValue(mockRequests);

      const result = await myJoinRequests(null, {}, mockContext);

      expect(result).toHaveLength(1);
      expect(result[0].ownerId._id).toBe("owner1");
    });
  });
});
