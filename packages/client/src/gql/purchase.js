import {gql} from '@apollo/client';

export const ADD_PURCHASES_QUERY = gql`
  mutation AddPurchasesQuery($purchases: [PurchaseInput!]!) {
    addPurchases(purchases: $purchases) {
      id
      name
      quantity
      unit
      price
      category
      discount
      date
      note
    }
  }
`;

export const UPDATE_PURCHASE_DATA = gql`
  mutation UpdatePurchase($purchase: UpdatePurchaseInput!) {
    updatePurchases(updates: [$purchase]) {
      id
      name
      quantity
      unit
      price
      category
      discount
      date
      note
    }
  }
`;
