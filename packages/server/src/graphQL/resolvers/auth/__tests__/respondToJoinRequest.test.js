const { GraphQLError } = require("graphql");
const respondToJoinRequest = require("../respondToJoinRequest");
const { FamilyJoinRequest, User } = require("../../../../database/schemas");
const { sendFamilyJoinResponseEmail } = require("../../../../auth/emailService");
const ERROR_CODES = require("../../../../constants/errorCodes");

// Mock dependencies
jest.mock("../../../../database/schemas");
jest.mock("../../../../auth/emailService");

describe("respondToJoinRequest", () => {
  let mockContext;
  let mockArgs;
  let mockJoinRequest;
  let consoleErrorSpy;
  let consoleLogSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    mockJoinRequest = {
      _id: "request123",
      isActive: true,
      status: "PENDING",
      userId: {
        _id: "user123",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com"
      },
      familyId: {
        _id: "family123",
        name: "Test Family",
        ownerId: {
          equals: jest.fn().mockReturnValue(true)
        }
      }
    };

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: { _id: "owner123", email: "owner@example.com" }
      }
    };

    mockArgs = {
      input: {
        requestId: "request123",
        response: "APPROVE",
        message: "Welcome!"
      }
    };

    // Working mocks
    FamilyJoinRequest.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockJoinRequest)
      })
    });

    FamilyJoinRequest.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            ...mockJoinRequest,
            status: "APPROVED"
          })
        })
      })
    });

    User.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        firstName: "John",
        lastName: "Owner"
      })
    });
    
    sendFamilyJoinResponseEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("authentication", () => {
    it("should require authentication", async () => {
      await expect(
        respondToJoinRequest(null, mockArgs, {})
      ).rejects.toThrow("Authentication required");
    });

    it("should require authenticated user", async () => {
      await expect(
        respondToJoinRequest(null, mockArgs, { auth: { isAuthenticated: false }})
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("successful approval", () => {
    it("should approve join request", async () => {
      const result = await respondToJoinRequest(null, mockArgs, mockContext);

      expect(result.status).toBe("APPROVED");
      expect(FamilyJoinRequest.findById).toHaveBeenCalledWith("request123");
    });

    it("should add user to family when approved", async () => {
      await respondToJoinRequest(null, mockArgs, mockContext);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        familyId: "family123",
        roleInFamily: "MEMBER"
      });
    });

    it("should send email notification", async () => {
      await respondToJoinRequest(null, mockArgs, mockContext);

      expect(sendFamilyJoinResponseEmail).toHaveBeenCalled();
    });
  });

  describe("successful rejection", () => {
    beforeEach(() => {
      mockArgs.input.response = "REJECT";
      FamilyJoinRequest.findByIdAndUpdate().populate().populate().populate.mockResolvedValue({
        ...mockJoinRequest,
        status: "REJECTED"
      });
    });

    it("should reject join request", async () => {
      const result = await respondToJoinRequest(null, mockArgs, mockContext);

      expect(result.status).toBe("REJECTED");
    });

    it("should not add user to family when rejected", async () => {
      await respondToJoinRequest(null, mockArgs, mockContext);

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("validation errors", () => {
    it("should fail when join request not found", async () => {
      FamilyJoinRequest.findById().populate().populate.mockResolvedValue(null);

      await expect(
        respondToJoinRequest(null, mockArgs, mockContext)
      ).rejects.toThrow("Join request not found");
    });

    it("should fail when request is inactive", async () => {
      FamilyJoinRequest.findById().populate().populate.mockResolvedValue({
        ...mockJoinRequest,
        isActive: false
      });

      await expect(
        respondToJoinRequest(null, mockArgs, mockContext)
      ).rejects.toThrow("Join request not found");
    });

    it("should fail when request already processed", async () => {
      FamilyJoinRequest.findById().populate().populate.mockResolvedValue({
        ...mockJoinRequest,
        status: "APPROVED"
      });

      await expect(
        respondToJoinRequest(null, mockArgs, mockContext)
      ).rejects.toThrow("Join request has already been responded to");
    });

    it("should fail when user is not family owner", async () => {
      mockJoinRequest.familyId.ownerId.equals.mockReturnValue(false);

      await expect(
        respondToJoinRequest(null, mockArgs, mockContext)
      ).rejects.toThrow("Only family owners can respond to join requests");
    });
  });

  describe("error handling", () => {
    it("should handle database errors", async () => {
      FamilyJoinRequest.findById().populate().populate.mockRejectedValue(new Error("DB error"));

      await expect(
        respondToJoinRequest(null, mockArgs, mockContext)
      ).rejects.toThrow("Failed to respond to join request");

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should continue when email fails", async () => {
      sendFamilyJoinResponseEmail.mockRejectedValue(new Error("Email failed"));

      const result = await respondToJoinRequest(null, mockArgs, mockContext);

      expect(result.status).toBe("APPROVED");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to send join response email:",
        "Email failed"
      );
    });
  });
});
