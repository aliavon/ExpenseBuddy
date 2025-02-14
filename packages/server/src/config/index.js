const DATABASE_PORT = process.env.DATABASE_PORT || 27017;
const DATABASE_HOST = process.env.DATABASE_HOST;

const mongooseConfig = {
  autoIndex: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = {
  APP_CLIENT_PORT: process.env.APP_CLIENT_PORT,
  APP_SERVER_PORT: process.env.APP_SERVER_PORT || 8000,
  DATABASE_HOST: process.env.DATABASE_HOST,
  DATABASE_PORT,
  API_HOST: process.env.API_HOST || "http://localhost:3000",
  DATABASE_URL:
    DATABASE_HOST || `mongodb://expenseBuddyMongoDB:${DATABASE_PORT}/server`,
  mongooseConfig,
};
