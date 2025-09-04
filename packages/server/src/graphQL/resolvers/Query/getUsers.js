const { requireFamily } = require("../../../auth");
const mongoose = require("mongoose");

module.exports = async (_, { search }, context) => {
  const {
    schemas: { User },
    logger,
  } = context;

  // Require authentication and family membership
  const auth = requireFamily(context);

  const pipeline = [
    // First, filter by family
    {
      $match: {
        familyId: new mongoose.Types.ObjectId(auth.user.familyId),
        isActive: true,
      },
    },
    {
      $addFields: {
        fullName: {
          $trim: {
            input: {
              $concat: [
                "$firstName",
                " ",
                { $ifNull: ["$middleName", ""] },
                " ",
                "$lastName",
              ],
            },
          },
        },
      },
    },
  ];

  if (search && search.trim() !== "") {
    pipeline.push({
      $match: {
        fullName: { $regex: search, $options: "i" },
      },
    });
  }

  const users = await User.aggregate(pipeline);

  logger.info(
    {
      count: users.length,
      userId: auth.user.id,
      familyId: auth.user.familyId,
    },
    "Successfully retrieved family users by fullName"
  );

  return users;
};
