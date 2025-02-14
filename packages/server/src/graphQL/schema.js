const { SORT_ORDER_VALUES } = require("../constants/sortOrder");
const { PERIODICITY_VALUES } = require("../constants/familyIncomeEnums");

module.exports = `
  type Query {
    getPurchases(from: String!, to: String!): [Purchase!]!
    getCategories: [String!]!
    getUnits: [String!]!
    getPurchasesCategorySuggestion(names: [String!]!): [PurchaseCategoryInfo!]!
    getItems(names: [String!], category: String): [Item!]!

    getFamilyIncomePeriodicityOptions: [Option!]!
    getFamilyIncomeRecords(filters: FamilyIncomeFiltersInput, pagination: PaginationInput!, sort: SortInput): FamilyIncomeRecordsResponse!
  }

  type Mutation {
    addPurchases(purchases: [PurchaseInput!]!): [Purchase!]!
    updatePurchases(updates: [UpdatePurchaseInput!]!): [Purchase!]!
    deletePurchases(ids: [ID!]!): [ID!]!
    addItems(items: [ItemInput!]!): [Item!]!
    editItemsCategory(names: [String!]!, newCategory: String!): [Item!]!
  }

  type FamilyIncomeRecordsResponse {
    items: [FamilyIncome!]!
    pagination: PaginationMetadata!
  }

  type FamilyIncome {
    id: ID!
    date: String!
    amount: Float!
    note: String
    periodicity: Periodicity!
    type: IncomeType
    contributor: User
  }

  type IncomeType {
    id: ID!
    name: String!
    description: String
  }

  type User {
    id: ID!
    name: String!
    isVerified: Boolean!
  }

  input SortInput {
    sortBy: String
    sortOrder: SortOrder
  }

  enum SortOrder { ${SORT_ORDER_VALUES.join(", ")} }

  enum Periodicity { ${PERIODICITY_VALUES.join(", ")} }

  input PaginationInput {
    page: Int!
    limit: Int!
  }

  input FamilyIncomeFiltersInput {
    dateFrom: String
    dateTo: String
    contributorId: ID
    typeId: ID
  }

  type PaginationMetadata {
    currentPage: Int!
    nextPage: Int
    totalPages: Int!
    totalCount: Int!
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

  type Option {
    value: String!
    label: String!
  }
`;
