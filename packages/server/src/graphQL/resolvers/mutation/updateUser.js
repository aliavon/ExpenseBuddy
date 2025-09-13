const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");
const { requireSelfOrAdmin } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { user }, context) => {
  const {
    schemas: { User },
    logger,
  } = context;
  const { id, ...fields } = user;

  // Require authentication and check user can update this specific user
  const auth = requireSelfOrAdmin(context, id);

  // Only update user from the same family
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(id),
      familyId: new mongoose.Types.ObjectId(auth.user.familyId),
    },
    { $set: fields },
    { new: true }
  );

  if (!updatedUser) {
    throw new GraphQLError(`User not found for id ${id} in your family`, {
      extensions: { code: ERROR_CODES.GET_USER_ERROR },
    });
  }

  logger.info(
    {
      id: updatedUser._id.toString(),
      updatedBy: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully updated family user"
  );

  return updatedUser;
};
