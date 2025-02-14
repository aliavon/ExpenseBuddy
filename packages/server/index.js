const mongoose = require("mongoose");
const { createServer } = require("node:http");

const yoga = require("./src/server");

const {
  APP_SERVER_PORT,
  DATABASE_URL,
  mongooseConfig,
} = require("./src/config");

mongoose.set("strictQuery", true);

mongoose.connect(DATABASE_URL, mongooseConfig).catch((e) => console.error(e));

const server = createServer(yoga);

server.listen(APP_SERVER_PORT, () => {
  console.info(
    `Server is running on http://localhost:${APP_SERVER_PORT}/graphql`
  );
});
