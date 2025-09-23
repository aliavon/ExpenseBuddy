import { useCreateMoneyBundle, useUpdateMoneyBundle, useDeleteMoneyBundle, verifyMutateHookExports } from '../index';

describe('GraphQL Mutate Hooks Index', () => {
  it('should have verifyMutateHookExports function that returns hook metadata', () => {
    // This should execute the verifyMutateHookExports function to get coverage
    const hookMetadata = verifyMutateHookExports();
    expect(hookMetadata).toEqual({
      totalHooks: 3,
      hooksAvailable: [
        'useCreateMoneyBundle',
        'useUpdateMoneyBundle', 
        'useDeleteMoneyBundle'
      ]
    });
  });
  it('should export all mutation hooks', () => {
    // This should cover the import statements in the index file
    expect(useCreateMoneyBundle).toBeDefined();
    expect(useUpdateMoneyBundle).toBeDefined();
    expect(useDeleteMoneyBundle).toBeDefined();
    
    // Verify they are functions
    expect(typeof useCreateMoneyBundle).toBe('function');
    expect(typeof useUpdateMoneyBundle).toBe('function');
    expect(typeof useDeleteMoneyBundle).toBe('function');
  });

  it('should export useCreateMoneyBundle', () => {
    // This should cover line 5: export { useCreateMoneyBundle, ... }
    expect(useCreateMoneyBundle).toBeDefined();
    expect(typeof useCreateMoneyBundle).toBe('function');
  });

  it('should export useUpdateMoneyBundle', () => {
    // This should cover line 5: export { ..., useUpdateMoneyBundle, ... }
    expect(useUpdateMoneyBundle).toBeDefined();
    expect(typeof useUpdateMoneyBundle).toBe('function');
  });

  it('should export useDeleteMoneyBundle', () => {
    // This should cover line 5: export { ..., useDeleteMoneyBundle }
    expect(useDeleteMoneyBundle).toBeDefined();
    expect(typeof useDeleteMoneyBundle).toBe('function');
  });

  it('should import individual hooks without errors', () => {
    expect(() => require('../use-create-money-bundle')).not.toThrow();
    expect(() => require('../use-delete-money-bundle')).not.toThrow();
    expect(() => require('../use-update-money-bundle')).not.toThrow();
  });
}); 