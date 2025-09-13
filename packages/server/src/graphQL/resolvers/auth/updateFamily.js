const { GraphQLError } = require("graphql");
const { Family, Currency } = require("../../../database/schemas");
const { withValidationCurried, updateFamilySchema } = require("../validation");
const { withErrorHandlingCurried } = require("../error-handling");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Update family settings (requires family ownership)
 */
async function updateFamily(parent, args, context) {
  const { input } = args;

  try {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user) {
      throw new GraphQLError("You must be logged in to update family", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    const user = context.auth.user;

    // Find the family to update
    const family = await Family.findById(input.familyId);

    if (!family) {
      throw new GraphQLError("Family not found", {
        extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
      });
    }

    if (!family.isActive) {
      throw new GraphQLError("Family is not active", {
        extensions: { code: ERROR_CODES.FAMILY_NOT_FOUND },
      });
    }

    // Check if user is the owner of the family
    if (family.ownerId.toString() !== user._id.toString()) {
      throw new GraphQLError("Only family owner can update family settings", {
        extensions: { code: ERROR_CODES.UNAUTHENTICATED },
      });
    }

    // If currency is being updated, validate it
    if (input.currencyId) {
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
    }

    // Build update object with only provided fields
    const updateData = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.currencyId !== undefined) updateData.currency = input.currencyId;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;

    // Update family
    const updatedFamily = await Family.findByIdAndUpdate(
      input.familyId,
      updateData,
      { new: true }
    );

    return updatedFamily;
  } catch (error) {
    // Re-throw GraphQL errors
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle all other errors
    throw new GraphQLError("Failed to update family", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

// Export wrapped function as default
const wrappedUpdateFamily = withErrorHandlingCurried({
  errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
  errorMessage: "Failed to update family",
})(withValidationCurried(updateFamilySchema)(updateFamily));

module.exports = wrappedUpdateFamily;
// Export unwrapped function for testing
module.exports.updateFamilyResolver = updateFamily;
