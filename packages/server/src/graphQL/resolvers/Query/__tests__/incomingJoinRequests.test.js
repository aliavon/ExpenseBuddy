const { GraphQLError } = require("graphql");
const incomingJoinRequests = require("../incomingJoinRequests");
const { FamilyJoinRequest, Family } = require("../../../../database/schemas");
const ERROR_CODES = require("../../../../constants/errorCodes");

// Mock dependencies
jest.mock("../../../../database/schemas");

describe("incomingJoinRequests", () => {
  let mockContext;
  let mockOwner;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockOwner = {
      _id: "owner123",
      email: "owner@example.com"
    };

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: mockOwner
      }
    };

    // Simple working mocks
    Family.find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: "family1" },
          { _id: "family2" }
        ])
      })
    });

    FamilyJoinRequest.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: "request1",
                userId: {
                  _id: "user1",
                  firstName: "Jane",
                  lastName: "Doe",
                  email: "jane@example.com"
                },
                familyId: {
                  _id: "family1",
                  name: "Test Family"
                }
              }
            ])
          })
        })
      })
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("authentication", () => {
    it("should require authentication", async () => {
      await expect(
        incomingJoinRequests(null, {}, {})
      ).rejects.toThrow("Authentication required");
    });

    it("should require authenticated user", async () => {
      await expect(
        incomingJoinRequests(null, {}, { auth: { isAuthenticated: false, user: mockOwner }})
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("successful flow", () => {
    it("should return join requests successfully", async () => {
      const result = await incomingJoinRequests(null, {}, mockContext);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]._id).toBe("request1");
    });

    it("should query families owned by user", async () => {
      await incomingJoinRequests(null, {}, mockContext);

      expect(Family.find).toHaveBeenCalledWith({
        ownerId: "owner123",
        isActive: true
      });
    });

    it("should return empty array when no families owned", async () => {
      Family.find().select().lean.mockResolvedValue([]);

      const result = await incomingJoinRequests(null, {}, mockContext);

      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should handle family query errors", async () => {
      Family.find().select().lean.mockRejectedValue(new Error("DB error"));

      await expect(
        incomingJoinRequests(null, {}, mockContext)
      ).rejects.toThrow("Failed to fetch incoming join requests");
    });

    it("should handle join request query errors", async () => {
      FamilyJoinRequest.find().populate().populate().sort().lean.mockRejectedValue(new Error("DB error"));

      await expect(
        incomingJoinRequests(null, {}, mockContext)
      ).rejects.toThrow("Failed to fetch incoming join requests");
    });
  });
});
