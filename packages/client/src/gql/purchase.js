import {gql} from '@apollo/client';

export const ADD_PURCHASES_QUERY = gql`
  mutation AddPurchasesQuery($purchases: [PurchaseInput!]!) {
    addPurchases(purchases: $purchases) {
      id
      quantity
      unit
      price
      discount
      date
      note
      item {
        id
        category
        name
      }
    }
  }
`;

export const UPDATE_PURCHASE_DATA = gql`
  mutation UpdatePurchase($purchase: UpdatePurchaseInput!) {
    updatePurchases(updates: [$purchase]) {
      id
      quantity
      unit
      price
      discount
      date
      note
      item {
        id
        category
        name
      }
    }
  }
`;
