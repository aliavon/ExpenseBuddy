const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Suppress MongoDB deprecation warnings
mongoose.set('strictQuery', false);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    instance: {
      port: undefined, // Allow random port
      storageEngine: 'wiredTiger',
    },
    binary: {
      version: '6.0.4',
    },
  });
  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    maxPoolSize: 1, // Limit connection pool size for tests
  });
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (error) {
    console.warn('Error during database cleanup:', error.message);
  }
  
  try {
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.warn('Error stopping MongoDB Memory Server:', error.message);
  }
}, 10000); // Increase timeout to 10 seconds

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

global.mockLogger = mockLogger;

// Test utilities
global.createMockId = () => new mongoose.Types.ObjectId().toString();

global.createMockContext = (overrides = {}) => ({
  schemas: require("./src/database/schemas"),
  logger: mockLogger,
  loaders: {
    itemLoader: { load: jest.fn() },
    incomeTypeLoader: { load: jest.fn() },
    userLoader: { load: jest.fn() },
    currencyLoader: { load: jest.fn() },
  },
  ...overrides,
}); 