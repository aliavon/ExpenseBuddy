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

export const EDIT_ITEM_CATEGORY_MUTATION = gql`
  mutation EditItemCategory($name: String!, $newCategory: String!) {
    editItemCategory(name: $name, newCategory: $newCategory) {
      id
      name
      category
    }
  }
`;
