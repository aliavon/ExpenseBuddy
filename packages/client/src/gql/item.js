import {gql} from '@apollo/client';

export const GET_ITEMS_BY_CATEGORY_QUERY = gql`
  query GetItemsByCategory($category: String!) {
    items: getItems(category: $category) {
      label: name
      id
    }
  }
`;

export const GET_ITEMS_BY_NAMES_QUERY = gql`
  query GetItemsByNames($names: [String!]!) {
    items: getItems(names: $names) {
      id
      name
      category
    }
  }
`;

export const ADD_ITEMS_MUTATION = gql`
  mutation AddItems($items: [ItemInput!]!) {
    addItems(items: $items) {
      id
      name
      category
    }
  }
`;

export const EDIT_ITEMS_CATEGORY_MUTATION = gql`
  mutation EditItemsCategory($names: [String!]!, $newCategory: String!) {
    editItemsCategory(names: $names, newCategory: $newCategory) {
      id
      name
      category
    }
  }
`;
