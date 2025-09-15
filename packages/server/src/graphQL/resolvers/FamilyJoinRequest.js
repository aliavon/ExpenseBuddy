/**
 * FamilyJoinRequest field resolvers
 * Handle transformation of populated fields to match GraphQL schema
 */

const FamilyJoinRequestResolver = {
  /**
   * Transform _id to id for GraphQL
   * GraphQL schema expects: id: ID!
   * MongoDB uses _id field
   */
  id: (familyJoinRequest) => {
    return familyJoinRequest._id || familyJoinRequest.id;
  },

  /**
   * Transform populated userId to User object
   * GraphQL schema expects: user: User!
   * Mongoose populate returns full User object
   */
  user: (familyJoinRequest) => {
    // If userId is populated, return the populated User object
    if (
      familyJoinRequest.userId &&
      typeof familyJoinRequest.userId === "object" &&
      familyJoinRequest.userId._id
    ) {
      return familyJoinRequest.userId;
    }
    // If it's just an ID, return null (will be handled by GraphQL resolver)
    return null;
  },

  /**
   * Transform populated familyId to Family object
   * GraphQL schema expects: family: Family!
   * Mongoose populate returns full Family object
   */
  family: (familyJoinRequest) => {
    // If familyId is populated, return the populated Family object
    if (
      familyJoinRequest.familyId &&
      typeof familyJoinRequest.familyId === "object" &&
      familyJoinRequest.familyId._id
    ) {
      return familyJoinRequest.familyId;
    }
    // If it's just an ID, return null (will be handled by GraphQL resolver)
    return null;
  },

  /**
   * Transform populated ownerId to User object
   * GraphQL schema expects: owner: User!
   * Mongoose populate returns full User object
   */
  owner: (familyJoinRequest) => {
    // If ownerId is populated, return the populated User object
    if (
      familyJoinRequest.ownerId &&
      typeof familyJoinRequest.ownerId === "object" &&
      familyJoinRequest.ownerId._id
    ) {
      return familyJoinRequest.ownerId;
    }
    // If it's just an ID, return null (will be handled by GraphQL resolver)
    return null;
  },

  /**
   * Transform requestedAt Date to ISO string
   * GraphQL schema expects: requestedAt: String!
   */
  requestedAt: (familyJoinRequest) => {
    if (familyJoinRequest.requestedAt instanceof Date) {
      return familyJoinRequest.requestedAt.toISOString();
    }
    return familyJoinRequest.requestedAt;
  },

  /**
   * Transform respondedAt Date to ISO string
   * GraphQL schema expects: respondedAt: String
   */
  respondedAt: (familyJoinRequest) => {
    if (familyJoinRequest.respondedAt instanceof Date) {
      return familyJoinRequest.respondedAt.toISOString();
    }
    return familyJoinRequest.respondedAt;
  },
};

module.exports = FamilyJoinRequestResolver;
