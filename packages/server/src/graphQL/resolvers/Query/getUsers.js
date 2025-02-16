module.exports = async (_, { search }, { schemas: { User }, logger }) => {
  const pipeline = [
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
    { count: users.length },
    "Successfully retrieved users by fullName"
  );
  return users;
};
