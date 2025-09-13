const { requirePermission } = require("../../../auth");

module.exports = async (_, { user }, context) => {
  const {
    schemas: { User },
    logger,
  } = context;

  // Require authentication and member management permission
  const auth = requirePermission(context, "canManageMembers");

  // Enrich user with family context and defaults
  const enrichedUser = {
    ...user,
    familyId: auth.user.familyId,
    email: user.email || "", // Default empty email
    password: user.password || "", // Default empty password
    isEmailVerified: false,
    isActive: true,
    roleInFamily: "MEMBER", // New users default to MEMBER
  };

  const newUser = await User.create(enrichedUser);

  logger.info(
    {
      id: newUser._id.toString(),
      familyId: auth.user.familyId,
      createdBy: auth.user.id,
    },
    "Successfully created family user"
  );

  return newUser;
};
