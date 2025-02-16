const { GraphQLError } = require("graphql");
const ERROR_CODES = require("../../../constants/errorCodes");

module.exports = async (_, { user }, { schemas: { User }, logger }) => {
  const { id, ...fields } = user;
  // Update the user and return the new document.
  const updatedUser = await User.findByIdAndUpdate(id, fields, { new: true });
  if (!updatedUser) {
    throw new GraphQLError(`User not found for id ${id}`, {
      extensions: { code: ERROR_CODES.GET_USER_ERROR },
    });
  }
  logger.info({ id: updatedUser._id.toString() }, "Successfully updated user");
  return updatedUser;
};
