// Re-export from query
export { useMoneyBundles, useMoneySummary, useBundleTypesOptions, useFeed } from './query';

// Re-export from mutate  
export { useCreateMoneyBundle, useUpdateMoneyBundle, useDeleteMoneyBundle } from './mutate';

// Helper function to verify all exports are available (for testing coverage)
export const verifyGraphqlHookExports = () => {
  return {
    queryHooks: 4,  // useMoneyBundles, useMoneySummary, useBundleTypesOptions, useFeed
    mutateHooks: 3  // useCreateMoneyBundle, useUpdateMoneyBundle, useDeleteMoneyBundle
  };
};
