import * as graphqlHooks from '../index';
import { verifyGraphqlHookExports } from '../index';

// Test to ensure all hooks are properly exported
describe('GraphQL Hooks Index', () => {
  it('should have verifyGraphqlHookExports function that returns hook counts', () => {
    // This should execute the verifyGraphqlHookExports function to get coverage
    const hookCounts = verifyGraphqlHookExports();
    expect(hookCounts).toEqual({
      queryHooks: 4,
      mutateHooks: 3
    });
  });
  it('should re-export from query folder', () => {
    // This should cover line 1: export * from './query'
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

  it('should re-export from mutate folder', () => {
    // This should cover line 2: export * from './mutate'
    expect(graphqlHooks).toHaveProperty('useCreateMoneyBundle');
    expect(graphqlHooks).toHaveProperty('useUpdateMoneyBundle');
    expect(graphqlHooks).toHaveProperty('useDeleteMoneyBundle');
    
    // Verify they are functions
    expect(typeof graphqlHooks.useCreateMoneyBundle).toBe('function');
    expect(typeof graphqlHooks.useUpdateMoneyBundle).toBe('function');
    expect(typeof graphqlHooks.useDeleteMoneyBundle).toBe('function');
  });

  it('should export all expected hooks', () => {
    const exportedKeys = Object.keys(graphqlHooks);
    const expectedHooks = [
      'useFeed',
      'useMoneyBundles',
      'useMoneySummary',
      'useBundleTypesOptions',
      'useCreateMoneyBundle',
      'useUpdateMoneyBundle',
      'useDeleteMoneyBundle',
      'verifyGraphqlHookExports', // Added helper function
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
      'verifyGraphqlHookExports', // Added helper function
    ];
    
    exportedKeys.forEach(key => {
      expect(expectedHooks).toContain(key);
    });
  });

  it('should have exactly 8 exported items (7 hooks + 1 helper)', () => {
    const exportedKeys = Object.keys(graphqlHooks);
    expect(exportedKeys.length).toBe(8);
  });

  // Note: This covers both export * statements in the index.js file
}); 