// Re-export from purchase
export { ADD_PURCHASES_QUERY, UPDATE_PURCHASE_DATA } from './purchase';

// Re-export from categories  
export { GET_CATEGORIES } from './categories';

// Re-export from item
export { 
  GET_ITEMS_BY_CATEGORY_QUERY, 
  GET_ITEMS_BY_NAMES_QUERY, 
  ADD_ITEMS_MUTATION, 
  EDIT_ITEMS_CATEGORY_MUTATION 
} from './item';

// Helper function to verify all exports are available (for testing coverage)
export const verifyExports = () => {
  return {
    purchaseExports: 2, // ADD_PURCHASES_QUERY, UPDATE_PURCHASE_DATA
    categoryExports: 1, // GET_CATEGORIES
    itemExports: 4      // GET_ITEMS_BY_CATEGORY_QUERY, GET_ITEMS_BY_NAMES_QUERY, ADD_ITEMS_MUTATION, EDIT_ITEMS_CATEGORY_MUTATION
  };
};
