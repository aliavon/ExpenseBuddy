/**
 * @jest-environment jsdom
 */

// Simple test for authLink module structure and exports
describe('authLink module', () => {
  it('should be importable without errors', () => {
    expect(() => {
      require('../authLink');
    }).not.toThrow();
  });

  it('should export required functions', () => {
    const authLinkModule = require('../authLink');
    
    expect(authLinkModule.default).toBeDefined(); // authLink as default export
    expect(typeof authLinkModule.setGlobalLogout).toBe('function'); // setGlobalLogout function
  });
});

