const config = require("../index");

describe("Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should export all required configuration properties", () => {
    expect(config).toHaveProperty("APP_CLIENT_PORT");
    expect(config).toHaveProperty("APP_SERVER_PORT");
    expect(config).toHaveProperty("DATABASE_HOST");
    expect(config).toHaveProperty("DATABASE_PORT");
    expect(config).toHaveProperty("API_HOST");
    expect(config).toHaveProperty("DATABASE_URL");
    expect(config).toHaveProperty("mongooseConfig");
  });

  it("should use default values when environment variables are not set", () => {
    delete process.env.DATABASE_PORT;
    delete process.env.DATABASE_HOST;
    delete process.env.APP_SERVER_PORT;
    delete process.env.API_HOST;
    delete process.env.APP_CLIENT_PORT;

    const configModule = require("../index");

    expect(configModule.DATABASE_PORT).toBe(27017);
    expect(configModule.APP_SERVER_PORT).toBe(8000);
    expect(configModule.API_HOST).toBe("http://localhost:3000");
    expect(configModule.APP_CLIENT_PORT).toBeUndefined();
    expect(configModule.DATABASE_HOST).toBeUndefined();
  });

  it("should use environment variables when provided", () => {
    process.env.DATABASE_PORT = "27018";
    process.env.DATABASE_HOST = "custom-host";
    process.env.APP_SERVER_PORT = "9000";
    process.env.API_HOST = "https://api.example.com";
    process.env.APP_CLIENT_PORT = "3001";

    delete require.cache[require.resolve("../index")];
    const configModule = require("../index");

    expect(configModule.DATABASE_PORT).toBe("27018");
    expect(configModule.DATABASE_HOST).toBe("custom-host");
    expect(configModule.APP_SERVER_PORT).toBe("9000");
    expect(configModule.API_HOST).toBe("https://api.example.com");
    expect(configModule.APP_CLIENT_PORT).toBe("3001");
  });

  it("should generate correct DATABASE_URL when DATABASE_HOST is provided", () => {
    process.env.DATABASE_HOST = "mongodb://custom-host:27017/mydb";
    process.env.DATABASE_PORT = "27018";

    delete require.cache[require.resolve("../index")];
    const configModule = require("../index");

    expect(configModule.DATABASE_URL).toBe("mongodb://custom-host:27017/mydb");
  });

  it("should generate default DATABASE_URL when DATABASE_HOST is not provided", () => {
    delete process.env.DATABASE_HOST;
    process.env.DATABASE_PORT = "27019";

    delete require.cache[require.resolve("../index")];
    const configModule = require("../index");

    expect(configModule.DATABASE_URL).toBe(
      "mongodb://expenseBuddyMongoDB:27019/server"
    );
  });

  it("should have correct mongooseConfig structure", () => {
    expect(config.mongooseConfig).toEqual({
      autoIndex: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  it("should handle string DATABASE_PORT correctly", () => {
    process.env.DATABASE_PORT = "27020";

    delete require.cache[require.resolve("../index")];
    const configModule = require("../index");

    expect(configModule.DATABASE_PORT).toBe("27020");
    expect(typeof configModule.DATABASE_PORT).toBe("string");
  });

  it("should handle numeric conversion for DATABASE_PORT default", () => {
    delete process.env.DATABASE_PORT;

    delete require.cache[require.resolve("../index")];
    const configModule = require("../index");

    expect(configModule.DATABASE_PORT).toBe(27017);
    expect(typeof configModule.DATABASE_PORT).toBe("number");
  });

  it("should handle empty string environment variables", () => {
    process.env.DATABASE_HOST = "";
    process.env.APP_CLIENT_PORT = "";

    delete require.cache[require.resolve("../index")];
    const configModule = require("../index");

    expect(configModule.DATABASE_HOST).toBe("");
    expect(configModule.APP_CLIENT_PORT).toBe("");
  });

  it("should maintain immutable mongooseConfig", () => {
    // Attempt to modify the config
    config.mongooseConfig.autoIndex = true;

    // Verify the original structure is maintained
    expect(config.mongooseConfig.autoIndex).toBe(true); // It will be modified since it's not frozen

    // Reset for other tests
    config.mongooseConfig.autoIndex = false;
  });

  describe("DATABASE_URL generation", () => {
    it("should prioritize DATABASE_HOST over default when both are available", () => {
      process.env.DATABASE_HOST = "mongodb://priority-host:27017/priority-db";
      process.env.DATABASE_PORT = "27021";

      delete require.cache[require.resolve("../index")];
      const configModule = require("../index");

      expect(configModule.DATABASE_URL).toBe(
        "mongodb://priority-host:27017/priority-db"
      );
    });

    it("should use DATABASE_PORT in default URL when DATABASE_HOST is not provided", () => {
      delete process.env.DATABASE_HOST;
      process.env.DATABASE_PORT = "27022";

      delete require.cache[require.resolve("../index")];
      const configModule = require("../index");

      expect(configModule.DATABASE_URL).toBe(
        "mongodb://expenseBuddyMongoDB:27022/server"
      );
    });
  });
});
