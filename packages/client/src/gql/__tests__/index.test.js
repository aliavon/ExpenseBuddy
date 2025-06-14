describe('GQL Index', () => {
  it('should export all gql modules', () => {
    const gqlIndex = require('../index');
    
    // Check that the module exports are available
    expect(gqlIndex).toBeDefined();
    
    // Since it's re-exporting from other modules, 
    // we just verify the import doesn't throw
    expect(() => require('../index')).not.toThrow();
  });

  it('should import without errors', () => {
    expect(() => require('../purchase')).not.toThrow();
    expect(() => require('../categories')).not.toThrow();
    expect(() => require('../item')).not.toThrow();
  });
}); 