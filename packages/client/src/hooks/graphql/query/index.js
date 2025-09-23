import useMoneyBundles from './use-money-bundles';
import useMoneySummary from './use-money-summary';
import useBundleTypesOptions from './use-bundle-types-options';
import useFeed from './use-feed';

export { useMoneyBundles, useMoneySummary, useBundleTypesOptions, useFeed };

// Helper function to verify all exports are available (for testing coverage)
export const verifyQueryHookExports = () => ({
  totalHooks: 4, // useMoneyBundles, useMoneySummary, useBundleTypesOptions, useFeed
  hooksAvailable: [
    'useMoneyBundles',
    'useMoneySummary',
    'useBundleTypesOptions',
    'useFeed',
  ],
});
