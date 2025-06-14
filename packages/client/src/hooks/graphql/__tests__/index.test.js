import * as graphqlHooks from '../index';

// Test to ensure all hooks are properly exported
describe('GraphQL Hooks Index', () => {
  it('should export all query hooks', () => {
    expect(graphqlHooks).toHaveProperty('useFeed');
    expect(graphqlHooks).toHaveProperty('useMoneyBundles');
    expect(graphqlHooks).toHaveProperty('useMoneySummary');
    expect(graphqlHooks).toHaveProperty('useBundleTypesOptions');
    
    // Verify they are functions
    expect(typeof graphqlHooks.useFeed).toBe('function');
    expect(typeof graphqlHooks.useMoneyBundles).toBe('function');
    expect(typeof graphqlHooks.useMoneySummary).toBe('function');
    expect(typeof graphqlHooks.useBundleTypesOptions).toBe('function');
  });

  it('should export all mutation hooks', () => {
    expect(graphqlHooks).toHaveProperty('useCreateMoneyBundle');
    expect(graphqlHooks).toHaveProperty('useUpdateMoneyBundle');
    expect(graphqlHooks).toHaveProperty('useDeleteMoneyBundle');
    
    // Verify they are functions
    expect(typeof graphqlHooks.useCreateMoneyBundle).toBe('function');
    expect(typeof graphqlHooks.useUpdateMoneyBundle).toBe('function');
    expect(typeof graphqlHooks.useDeleteMoneyBundle).toBe('function');
  });

  it('should export expected number of hooks', () => {
    const exportedKeys = Object.keys(graphqlHooks);
    const expectedHooks = [
      'useFeed',
      'useMoneyBundles',
      'useMoneySummary',
      'useBundleTypesOptions',
      'useCreateMoneyBundle',
      'useUpdateMoneyBundle',
      'useDeleteMoneyBundle',
    ];
    
    expectedHooks.forEach(hookName => {
      expect(exportedKeys).toContain(hookName);
    });
  });

  it('should not export any unexpected hooks', () => {
    const exportedKeys = Object.keys(graphqlHooks);
    const expectedHooks = [
      'useFeed',
      'useMoneyBundles',
      'useMoneySummary',
      'useBundleTypesOptions',
      'useCreateMoneyBundle',
      'useUpdateMoneyBundle',
      'useDeleteMoneyBundle',
    ];
    
    exportedKeys.forEach(key => {
      expect(expectedHooks).toContain(key);
    });
  });

  // Note: No default export needed, using named exports only
}); 