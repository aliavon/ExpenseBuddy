const { User } = require("../../database/schemas");
const userLoader = require("../../loaders/userLoader");

const Family = {
  /**
   * Resolve family owner
   */
  owner: async (family) => {
    if (!family.ownerId) return null;

    try {
      // Use userLoader for efficient batching
      return await userLoader.load(family.ownerId.toString());
    } catch (error) {
      console.error("Error loading family owner:", error);
      return null;
    }
  },

  /**
   * Resolve all family members
   */
  members: async (family) => {
    try {
      // Get all active users in this family
      const members = await User.find({
        familyId: family._id.toString ? family._id.toString() : family._id,
        isActive: true,
      }).sort({ roleInFamily: 1, firstName: 1 }); // OWNER first, then alphabetical

      return members;
    } catch (error) {
      console.error("Error loading family members:", error);
      return [];
    }
  },
};

module.exports = Family;
