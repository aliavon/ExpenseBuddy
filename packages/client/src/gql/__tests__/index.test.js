import * as gqlIndex from '../index';
import { verifyExports } from '../index';

describe('GQL Index', () => {
  it('should export all gql modules', () => {
    // Check that the module exports are available
    expect(gqlIndex).toBeDefined();
    
    // Since it's re-exporting from other modules, 
    // we just verify the import doesn't throw
    expect(() => require('../index')).not.toThrow();
  });

  it('should have verifyExports function that returns export counts', () => {
    // This should execute the verifyExports function to get coverage
    const exportCounts = verifyExports();
    expect(exportCounts).toEqual({
      purchaseExports: 2,
      categoryExports: 1,
      itemExports: 4
    });
  });

  it('should re-export from purchase module', () => {
    // This should cover the export * from './purchase' line
    expect(gqlIndex).toHaveProperty('ADD_PURCHASES_QUERY');
    expect(gqlIndex).toHaveProperty('UPDATE_PURCHASE_DATA');
  });

  it('should re-export from categories module', () => {
    // This should cover the export * from './categories' line
    expect(gqlIndex).toHaveProperty('GET_CATEGORIES');
  });

  it('should re-export from item module', () => {
    // This should cover the export * from './item' line
    expect(gqlIndex).toHaveProperty('GET_ITEMS_BY_CATEGORY_QUERY');
    expect(gqlIndex).toHaveProperty('GET_ITEMS_BY_NAMES_QUERY');
    expect(gqlIndex).toHaveProperty('ADD_ITEMS_MUTATION');
    expect(gqlIndex).toHaveProperty('EDIT_ITEMS_CATEGORY_MUTATION');
  });

  it('should import individual modules without errors', () => {
    expect(() => require('../purchase')).not.toThrow();
    expect(() => require('../categories')).not.toThrow();
    expect(() => require('../item')).not.toThrow();
  });
}); 