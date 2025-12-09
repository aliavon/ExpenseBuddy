const { GraphQLError } = require("graphql");
const {
  requestJoinFamilyResolver: requestJoinFamily,
} = require("../requestJoinFamily");
const {
  Family,
  User,
  FamilyJoinRequest,
} = require("../../../../database/schemas");
const { sendFamilyJoinRequestEmail } = require("../../../../auth/emailService");
const ERROR_CODES = require("../../../../constants/errorCodes");

// Mock dependencies
jest.mock("../../../../database/schemas");
jest.mock("../../../../auth/emailService");

describe("requestJoinFamily resolver", () => {
  let mockContext;
  let mockUser;
  let mockFamily;
  let mockOwner;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    mockUser = {
      _id: "user123",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      familyId: null, // Not in a family
    };

    mockOwner = {
      _id: "owner123",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
    };

    mockFamily = {
      _id: "family123",
      name: "Smith Family",
      ownerId: mockOwner,
      isActive: true,
    };

    mockContext = {
      auth: {
        isAuthenticated: true,
        user: mockUser,
      },
    };

    // Mock Family.findById
    Family.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockFamily),
      }),
    });

    // Mock User.findById
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      }),
    });

    // Mock FamilyJoinRequest.findOne
    FamilyJoinRequest.findOne = jest.fn().mockResolvedValue(null);

    // Mock FamilyJoinRequest.create
    FamilyJoinRequest.create = jest.fn().mockResolvedValue({
      _id: "request123",
      userId: "user123",
      familyId: "family123",
      status: "PENDING",
    });

    // Mock email service
    sendFamilyJoinRequestEmail.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("authentication", () => {
    it("should require authentication", async () => {
      await expect(
        requestJoinFamily(null, { familyId: "family123" }, {})
      ).rejects.toThrow(
        new GraphQLError("Authentication required", {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        })
      );
    });

    it("should require authenticated user", async () => {
      await expect(
        requestJoinFamily(
          null,
          { familyId: "family123" },
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
        requestJoinFamily(
          null,
          { familyId: "family123" },
          { auth: { isAuthenticated: true, user: null } }
        )
      ).rejects.toThrow(
        new GraphQLError("Authentication required", {
          extensions: { code: ERROR_CODES.UNAUTHENTICATED },
        })
      );
    });
  });

  describe("successful flow", () => {
    it("should create join request successfully", async () => {
      const result = await requestJoinFamily(
        null,
        { familyId: "family123" },
        mockContext
      );

      expect(result).toBe(true);
      expect(FamilyJoinRequest.create).toHaveBeenCalledWith({
        userId: "user123",
        familyId: "family123",
        ownerId: "owner123",
        status: "PENDING",
        message: "",
        requestedAt: expect.any(Date),
        isActive: true,
      });
    });

    it("should send email to family owner", async () => {
      await requestJoinFamily(null, { familyId: "family123" }, mockContext);

      expect(sendFamilyJoinRequestEmail).toHaveBeenCalledWith(
        "jane@example.com",
        "Smith Family",
        mockUser,
        "Jane"
      );
    });

    it("should continue if email fails", async () => {
      sendFamilyJoinRequestEmail.mockRejectedValue(new Error("SMTP error"));

      const result = await requestJoinFamily(
        null,
        { familyId: "family123" },
        mockContext
      );

      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to send join request email:",
        "SMTP error"
      );
      expect(FamilyJoinRequest.create).toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should reject if user already has a family", async () => {
      mockContext.auth.user.familyId = "existingFamily123";

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("You are already a member of a family", {
          extensions: { code: ERROR_CODES.USER_ALREADY_IN_FAMILY },
        })
      );

      expect(FamilyJoinRequest.create).not.toHaveBeenCalled();
    });

    it("should reject if family not found", async () => {
      Family.findById().populate().lean.mockResolvedValue(null);

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Family not found or inactive", {
          extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
        })
      );

      expect(FamilyJoinRequest.create).not.toHaveBeenCalled();
    });

    it("should reject if family is inactive", async () => {
      Family.findById()
        .populate()
        .lean.mockResolvedValue({ ...mockFamily, isActive: false });

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Family not found or inactive", {
          extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
        })
      );

      expect(FamilyJoinRequest.create).not.toHaveBeenCalled();
    });

    it("should reject if user not found", async () => {
      User.findById().select().lean.mockResolvedValue(null);

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("User not found", {
          extensions: { code: ERROR_CODES.USER_NOT_FOUND },
        })
      );

      expect(FamilyJoinRequest.create).not.toHaveBeenCalled();
    });

    it("should reject if pending request already exists", async () => {
      FamilyJoinRequest.findOne.mockResolvedValue({
        _id: "existingRequest123",
        userId: "user123",
        familyId: "family123",
        status: "PENDING",
      });

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("You already have a pending request for this family", {
          extensions: { code: ERROR_CODES.DUPLICATE_FAMILY_REQUEST },
        })
      );

      expect(FamilyJoinRequest.create).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      Family.findById()
        .populate()
        .lean.mockRejectedValue(new Error("Database error"));

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to send join request", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in requestJoinFamily:",
        expect.any(Error)
      );
    });

    it("should re-throw GraphQL errors", async () => {
      const customError = new GraphQLError("Custom error", {
        extensions: { code: "CUSTOM_CODE" },
      });

      Family.findById().populate().lean.mockRejectedValue(customError);

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(customError);
    });

    it("should handle User.findById errors", async () => {
      User.findById()
        .select()
        .lean.mockRejectedValue(new Error("User query failed"));

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to send join request", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );
    });

    it("should handle FamilyJoinRequest.create errors", async () => {
      FamilyJoinRequest.create.mockRejectedValue(
        new Error("Create request failed")
      );

      await expect(
        requestJoinFamily(null, { familyId: "family123" }, mockContext)
      ).rejects.toThrow(
        new GraphQLError("Failed to send join request", {
          extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
        })
      );
    });
  });

  describe("query checks", () => {
    it("should check for existing pending request", async () => {
      await requestJoinFamily(null, { familyId: "family123" }, mockContext);

      expect(FamilyJoinRequest.findOne).toHaveBeenCalledWith({
        userId: "user123",
        familyId: "family123",
        status: "PENDING",
        isActive: true,
      });
    });

    it("should populate family owner details", async () => {
      await requestJoinFamily(null, { familyId: "family123" }, mockContext);

      expect(Family.findById).toHaveBeenCalledWith("family123");
      expect(Family.findById().populate).toHaveBeenCalledWith(
        "ownerId",
        "firstName lastName email"
      );
    });

    it("should fetch requesting user details", async () => {
      await requestJoinFamily(null, { familyId: "family123" }, mockContext);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(User.findById().select).toHaveBeenCalledWith(
        "firstName lastName email"
      );
    });
  });
});
