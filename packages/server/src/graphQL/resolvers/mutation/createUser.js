module.exports = async (_, { user }, { schemas: { User }, logger }) => {
  // Create a new user using the provided input.
  const newUser = await User.create(user);
  logger.info({ id: newUser._id.toString() }, "Successfully created user");
  return newUser;
};
