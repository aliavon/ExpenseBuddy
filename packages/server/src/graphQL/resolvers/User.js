/**
 * User field resolvers
 * Handle transformation of populated fields to match GraphQL schema
 */

const UserResolver = {
  /**
   * Transform populated familyId to ID string for GraphQL
   * GraphQL schema expects: familyId: ID
   * But Mongoose populate returns full Family object
   */
  familyId: (user) => {
    // If familyId is populated, return the ID
    if (
      user.familyId &&
      typeof user.familyId === "object" &&
      user.familyId._id
    ) {
      return user.familyId._id;
    }
    // If it's already an ID, return as is
    return user.familyId;
  },
};

module.exports = UserResolver;
