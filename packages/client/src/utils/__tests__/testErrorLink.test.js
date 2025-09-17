/**
 * @jest-environment jsdom
 */

// Import the actual module to test its exports
// Since testErrorLink is a development utility, we'll test the structure
describe('testErrorLink module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be importable without errors', () => {
    expect(() => {
      require('../testErrorLink');
    }).not.toThrow();
  });

  it('should have expected exports available on window in development', () => {
    // Mock window object
    global.window = global.window || {};
    
    // Import the module (this should set up window.testErrorLink)
    require('../testErrorLink');
    
    // The module should set up window.testErrorLink with the expected structure
    expect(typeof window.testErrorLink).toBe('object');
  });
});

