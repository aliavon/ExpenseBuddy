import { useMoneyBundles, useMoneySummary, useBundleTypesOptions, useFeed, verifyQueryHookExports } from '../index';

describe('GraphQL Query Hooks Index', () => {
  it('should have verifyQueryHookExports function that returns hook metadata', () => {
    // This should execute the verifyQueryHookExports function to get coverage
    const hookMetadata = verifyQueryHookExports();
    expect(hookMetadata).toEqual({
      totalHooks: 4,
      hooksAvailable: [
        'useMoneyBundles',
        'useMoneySummary',
        'useBundleTypesOptions', 
        'useFeed'
      ]
    });
  });
  it('should export all query hooks', () => {
    // This should cover the import statements in the index file
    expect(useMoneyBundles).toBeDefined();
    expect(useMoneySummary).toBeDefined();
    expect(useBundleTypesOptions).toBeDefined();
    expect(useFeed).toBeDefined();
    
    // Verify they are functions
    expect(typeof useMoneyBundles).toBe('function');
    expect(typeof useMoneySummary).toBe('function');
    expect(typeof useBundleTypesOptions).toBe('function');
    expect(typeof useFeed).toBe('function');
  });

  it('should export useMoneyBundles', () => {
    // This should cover line 6: export { useMoneyBundles, ... }
    expect(useMoneyBundles).toBeDefined();
    expect(typeof useMoneyBundles).toBe('function');
  });

  it('should export useMoneySummary', () => {
    // This should cover line 6: export { ..., useMoneySummary, ... }
    expect(useMoneySummary).toBeDefined();
    expect(typeof useMoneySummary).toBe('function');
  });

  it('should export useBundleTypesOptions', () => {
    // This should cover line 6: export { ..., useBundleTypesOptions, ... }
    expect(useBundleTypesOptions).toBeDefined();
    expect(typeof useBundleTypesOptions).toBe('function');
  });

  it('should export useFeed', () => {
    // This should cover line 6: export { ..., useFeed }
    expect(useFeed).toBeDefined();
    expect(typeof useFeed).toBe('function');
  });

  it('should import individual hooks without errors', () => {
    expect(() => require('../use-money-bundles')).not.toThrow();
    expect(() => require('../use-money-summary')).not.toThrow();
    expect(() => require('../use-feed')).not.toThrow();
    expect(() => require('../use-bundle-types-options')).not.toThrow();
  });
}); 