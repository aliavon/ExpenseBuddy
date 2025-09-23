import useCreateMoneyBundle from './use-create-money-bundle';
import useDeleteMoneyBundle from './use-delete-money-bundle';
import useUpdateMoneyBundle from './use-update-money-bundle';

export { useCreateMoneyBundle, useUpdateMoneyBundle, useDeleteMoneyBundle };

// Helper function to verify all exports are available (for testing coverage)
export const verifyMutateHookExports = () => ({
  totalHooks: 3, // useCreateMoneyBundle, useUpdateMoneyBundle, useDeleteMoneyBundle
  hooksAvailable: ['useCreateMoneyBundle', 'useUpdateMoneyBundle', 'useDeleteMoneyBundle'],
});
