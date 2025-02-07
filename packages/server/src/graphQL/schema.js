module.exports = `
  type Query {
    test: String
    getPurchases(from: String!, to: String!): [Purchase!]!
    getCategories: [String!]!
    getUnits: [String!]!
  }

  type Mutation {
    addPurchases(purchases: [PurchaseInput!]!): [Purchase!]!
    updatePurchases(updates: [UpdatePurchaseInput!]!): [Purchase!]!
    deletePurchases(ids: [ID!]!): [ID!]!
    updateCategory(id: ID!, newCategory: String!, sync: Boolean!): [Purchase!]!
  }

  type Purchase {
    id: ID!
    name: String!
    quantity: Float!
    unit: String!
    price: Float!
    category: String
    discount: Float
    date: String!
    note: String
  }

  input PurchaseInput {
    name: String!
    quantity: Float!
    unit: String!
    price: Float!
    category: String
    discount: Float
    date: String!
    note: String
  }

  input UpdatePurchaseInput {
    id: ID!
    name: String
    quantity: Float
    unit: String
    price: Float
    category: String
    discount: Float
    date: String
    note: String
  }
`
