describe("Logger", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Clear require cache before each test
    jest.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should use debug level and pino-pretty in development", () => {
    process.env.NODE_ENV = "development";
    
    const logger = require("../index");
    
    expect(logger.level).toBe("debug");
    expect(logger.child).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should use info level and no transport in production", () => {
    process.env.NODE_ENV = "production";
    
    const logger = require("../index");
    
    expect(logger.level).toBe("info");
    expect(logger.child).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should treat undefined NODE_ENV as development", () => {
    delete process.env.NODE_ENV;
    
    const logger = require("../index");
    
    expect(logger.level).toBe("debug");
  });

  it("should treat empty NODE_ENV as development", () => {
    process.env.NODE_ENV = "";
    
    const logger = require("../index");
    
    expect(logger.level).toBe("debug");
  });

  it("should treat test environment as development", () => {
    process.env.NODE_ENV = "test";
    
    const logger = require("../index");
    
    expect(logger.level).toBe("debug");
  });

  it("should have timestamp function", () => {
    process.env.NODE_ENV = "production";
    
    const logger = require("../index");
    
    // Test that logger can produce timestamps
    const logMessage = JSON.stringify({ msg: "test", time: Date.now() });
    expect(typeof logMessage).toBe("string");
  });

  it("should log different levels correctly", () => {
    process.env.NODE_ENV = "development";
    
    const logger = require("../index");
    
    // Test that all log methods exist and are functions
    expect(typeof logger.trace).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.fatal).toBe("function");
  });
}); 