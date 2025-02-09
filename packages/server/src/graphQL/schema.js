module.exports = `
  type Query {
    getPurchases(from: String!, to: String!): [Purchase!]!
    getCategories: [String!]!
    getUnits: [String!]!
    getPurchasesCategorySuggestion(names: [String!]!): [PurchaseCategoryInfo!]!
    getItems(names: [String!], category: String): [Item!]!
  }

  type Mutation {
    addPurchases(purchases: [PurchaseInput!]!): [Purchase!]!
    updatePurchases(updates: [UpdatePurchaseInput!]!): [Purchase!]!
    deletePurchases(ids: [ID!]!): [ID!]!
    addItems(items: [ItemInput!]!): [Item!]!
    editItemsCategory(names: [String!]!, newCategory: String!): [Item!]!
  }

  type PurchaseCategoryInfo {
    name: String!
    category: String
  }

  input ItemInput {
    name: String!
    category: String
  }

  type Item {
    id: ID!
    name: String!
    category: String
  }

  type Purchase {
    id: ID!
    item: Item!
    quantity: Float!
    unit: String!
    price: Float!
    discount: Float
    date: String!
    note: String
  }

  input PurchaseInput {
    itemId: ID!
    quantity: Float!
    unit: String!
    price: Float!
    discount: Float
    date: String!
    note: String
  }

  input UpdatePurchaseInput {
    id: ID!
    itemId: ID
    quantity: Float
    unit: String
    price: Float
    discount: Float
    date: String
    note: String
  }
`
