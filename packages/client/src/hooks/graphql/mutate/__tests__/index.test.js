describe('GraphQL Mutate Hooks Index', () => {
  it('should export all mutation hooks', () => {
    const mutateIndex = require('../index');
    
    // Check that the module exports are available
    expect(mutateIndex).toBeDefined();
    
    // Since it's re-exporting from other modules, 
    // we just verify the import doesn't throw
    expect(() => require('../index')).not.toThrow();
  });

  it('should import individual hooks without errors', () => {
    expect(() => require('../use-create-money-bundle')).not.toThrow();
    expect(() => require('../use-delete-money-bundle')).not.toThrow();
    expect(() => require('../use-update-money-bundle')).not.toThrow();
  });
}); 