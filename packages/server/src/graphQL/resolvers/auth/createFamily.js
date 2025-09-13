const { GraphQLError } = require("graphql");
const { generateInviteCode } = require("../../../utils/inviteCodeGenerator");
const { Family, Currency, User } = require("../../../database/schemas");
const { withValidationCurried, createFamilySchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Create a new family (requires authentication)
 */
async function createFamily(parent, args, context) {
  const { input } = args;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to create a family", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Check if user is already in a family
    if (user.familyId) {
      throw new GraphQLError("You are already a member of a family", {
        extensions: { code: ERROR_CODES.VALIDATION_ERROR },
      });
    }

    // Validate currency exists and is active
    const currency = await Currency.findById(input.currencyId);

    if (!currency) {
      throw new GraphQLError("Currency not found", {
        extensions: { code: ERROR_CODES.CURRENCY_NOT_FOUND },
      });
    }

    if (!currency.isActive) {
      throw new GraphQLError("Currency is not available", {
        extensions: { code: ERROR_CODES.CURRENCY_NOT_FOUND },
      });
    }

    // Generate unique invite code
    const inviteCode = generateInviteCode();

    // Create family
    const familyData = {
      name: input.name,
      description: input.description,
      currency: input.currencyId,
      timezone: input.timezone || "UTC",
      ownerId: user._id,
      inviteCode,
      isActive: true,
    };

    const newFamily = await Family.create(familyData);

    // Update user to be a member of the new family
    await User.findByIdAndUpdate(
      user._id,
      { familyId: newFamily._id },
      { new: true }
    );

    return newFamily;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to create family", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default
const wrappedCreateFamily = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to create family",
})(withValidationCurried(createFamilySchema)(createFamily));

module.exports = wrappedCreateFamily;
// Export unwrapped function for testing
module.exports.createFamilyResolver = createFamily;
