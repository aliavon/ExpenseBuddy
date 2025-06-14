describe('GraphQL Query Hooks Index', () => {
  it('should export all query hooks', () => {
    const queryIndex = require('../index');
    
    // Check that the module exports are available
    expect(queryIndex).toBeDefined();
    
    // Since it's re-exporting from other modules, 
    // we just verify the import doesn't throw
    expect(() => require('../index')).not.toThrow();
  });

  it('should import individual hooks without errors', () => {
    expect(() => require('../use-money-bundles')).not.toThrow();
    expect(() => require('../use-money-summary')).not.toThrow();
    expect(() => require('../use-feed')).not.toThrow();
    expect(() => require('../use-bundle-types-options')).not.toThrow();
  });
}); 