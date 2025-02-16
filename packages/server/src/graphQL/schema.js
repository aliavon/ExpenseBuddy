const { SORT_ORDER_VALUES } = require("../constants/sortOrder");
const { PERIODICITY_VALUES } = require("../constants/familyIncomeEnums");

module.exports = `
  type Query {
    # Query for fetching purchases within a date range.
    getPurchases(from: String!, to: String!): [Purchase!]!

    # Query to retrieve distinct categories from items.
    getCategories: [String!]!

    # Query to get distinct units used in purchases.
    getUnits: [String!]!

    # Query for getting suggested purchase categories based on provided names.
    getPurchasesCategorySuggestion(names: [String!]!): [PurchaseCategoryInfo!]!

    # Query for retrieving items, optionally filtered by names and category.
    getItems(names: [String!], category: String): [Item!]!

    # Query for retrieving a list of currencies.
    getCurrencies: [Currency!]!

    # Query for retrieving a list of income types.
    getIncomeTypes: [IncomeType!]!

    # Query for fetching users with an optional full name search.
    getUsers(search: String): [User!]!

    # Query for retrieving periodicity options for family income.
    getFamilyIncomePeriodicityOptions: [Option!]!

    # Query for retrieving FamilyIncome records with filters, pagination, and sorting.
    # Returns both the items and pagination metadata.
    getFamilyIncomeRecords(
      filters: FamilyIncomeFiltersInput,
      pagination: PaginationInput!,
      sort: SortInput
    ): FamilyIncomeRecordsResponse!
  }

  type Mutation {
    # Mutations for Purchase-related operations.
    addPurchases(purchases: [PurchaseInput!]!): [Purchase!]!
    updatePurchases(updates: [UpdatePurchaseInput!]!): [Purchase!]!
    deletePurchases(ids: [ID!]!): [ID!]!

    # Mutations for Item-related operations.
    addItems(items: [ItemInput!]!): [Item!]!
    editItemsCategory(names: [String!]!, newCategory: String!): [Item!]!

    # Mutations for Currency-related operations.
    createCurrencies(currencies: [CurrencyInput!]!): [Currency!]!
    updateCurrencies(updates: [UpdateCurrencyInput!]!): [Currency!]!
    deleteCurrencies(ids: [ID!]!): [ID!]!

    # Mutations for IncomeType-related operations.
    createIncomeTypes(incomeTypes: [IncomeTypeInput!]!): [IncomeType!]!
    updateIncomeTypes(updates: [UpdateIncomeTypeInput!]!): [IncomeType!]!
    deleteIncomeTypes(ids: [ID!]!): [ID!]!
  }

  # ----- IncomeType-related inputs and types -----

  input IncomeTypeInput {
    name: String!         # The name of the income type; required.
    description: String   # A brief description (optional).
  }

  input UpdateIncomeTypeInput {
    id: ID!               # The ID of the income type to update.
    name: String          # New name (optional).
    description: String   # New description (optional).
  }

  type IncomeType {
    id: ID!
    name: String!
    description: String
  }

  # ----- Currency-related inputs and types -----

  input CurrencyInput {
    name: String!         # Full name of the currency (e.g., "US Dollar").
    code: String!         # Currency code (e.g., "USD"); required.
    symbol: String        # Currency symbol (e.g., "$"); optional.
  }

  input UpdateCurrencyInput {
    id: ID!               # The ID of the currency to update.
    name: String          # New name (optional).
    code: String          # New code (optional).
    symbol: String        # New symbol (optional).
  }

  type Currency {
    id: ID!
    name: String!
    code: String!
    symbol: String
  }

  # ----- FamilyIncome and its related types -----

  # This type represents the paginated response for FamilyIncome queries.
  type FamilyIncomeRecordsResponse {
    items: [FamilyIncome!]!     # Array of FamilyIncome records.
    pagination: PaginationMetadata!  # Metadata about pagination.
  }

  # FamilyIncome represents an income record in a family context.
  type FamilyIncome {
    id: ID!
    date: String!           # Date of the income (ISO string).
    amount: Float!          # Amount of income.
    note: String            # Additional notes.
    periodicity: Periodicity!   # How frequently the income occurs.
    type: IncomeType        # The type of income (via ref to IncomeType).
    contributor: User       # The user who contributed this income.
    currency: Currency      # The currency in which the income is recorded.
  }

  # Enum for periodicity values, generated from constants.
  enum Periodicity { ${PERIODICITY_VALUES.join(", ")} }

  # Input type for filtering FamilyIncome records.
  input FamilyIncomeFiltersInput {
    dateFrom: String        # Filter records from this date (inclusive).
    dateTo: String          # Filter records up to this date (inclusive).
    contributorId: ID       # Filter by contributor.
    typeId: ID              # Filter by income type.
  }

  # Pagination input for FamilyIncome queries.
  input PaginationInput {
    page: Int!
    limit: Int!
  }

  # Sorting input for FamilyIncome queries.
  input SortInput {
    sortBy: String          # Field to sort by (e.g., "date" or "amount").
    sortOrder: SortOrder    # Sorting order: either ASC or DESC.
  }

  # Metadata returned along with paginated FamilyIncome records.
  type PaginationMetadata {
    currentPage: Int!
    nextPage: Int          # Null if there is no next page.
    totalPages: Int!
    totalCount: Int!
  }

  # ----- User-related types and inputs -----

  # The User type now uses separate fields for first, middle, and last names.
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String!       # Usually computed by concatenating first, middle, and last names.
    middleName: String      # Optional middle name.
    isVerified: Boolean!
  }

  input UserInput {
    firstName: String!
    middleName: String
    lastName: String!
    isVerified: Boolean
  }

  input UpdateUserInput {
    id: ID!
    firstName: String
    middleName: String
    lastName: String
    # Additional fields can be added in the future.
  }

  # ----- Purchase-related types and inputs -----

  type Purchase {
    id: ID!
    item: Item!             # Reference to an Item.
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

  # ----- Item-related types and inputs -----

  type Item {
    id: ID!
    name: String!
    category: String
  }

  input ItemInput {
    name: String!
    category: String
  }

  # ----- Other types -----

  # PurchaseCategoryInfo is used for suggesting categories based on purchase names.
  type PurchaseCategoryInfo {
    name: String!
    category: String
  }

  # Option is a generic type for select options (e.g., for periodicity or other enums).
  type Option {
    value: String!
    label: String!
  }

  # Enum for sort order, generated from constants.
  enum SortOrder { ${SORT_ORDER_VALUES.join(", ")} }

`;
