const { GraphQLError } = require("graphql");
const { Family, User } = require("../../../database/schemas");
const ERROR_CODES = require("../../../constants/errorCodes");

/**
 * Search families by name for users looking to join
 */
async function searchFamilies(parent, args, context) {
  const { auth } = context;

  // Check if user is authenticated
  if (!auth || !auth.isAuthenticated || !auth.user) {
    throw new GraphQLError("Authentication required", {
      extensions: { code: ERROR_CODES.UNAUTHENTICATED },
    });
  }
  const { searchTerm } = args;

  try {
    // Search for active families by name (case insensitive)
    const families = await Family.find({
      name: { $regex: searchTerm, $options: "i" },
      isActive: true,
    })
      .populate("ownerId", "firstName lastName")
      .limit(10); // Limit results to prevent large response

    // Transform to search result format
    const searchResults = await Promise.all(
      families.map(async (family) => {
        // Get member count
        const memberCount = await User.countDocuments({
          familyId: family._id,
          isActive: true,
        });

        return {
          id: family._id.toString(),
          name: family.name,
          description: family.description,
          memberCount,
          owner: family.ownerId, // Already populated
        };
      })
    );

    return searchResults;
  } catch (error) {
    console.error("Error searching families:", error);
    throw new GraphQLError("Failed to search families", {
      extensions: { code: ERROR_CODES.INTERNAL_SERVER_ERROR },
    });
  }
}

module.exports = searchFamilies;
