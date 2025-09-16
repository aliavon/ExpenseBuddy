const { SORT_ORDER_VALUES } = require("../constants/sortOrder");
const { PERIODICITY_VALUES } = require("../constants/familyIncomeEnums");

module.exports = `
  # ----- Authentication Types -----

  # AuthPayload is returned by authentication mutations (login, register, refreshToken)
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type RegistrationPayload {
    success: Boolean!
    message: String!
  }

  # Enum for family roles  
  enum FamilyRole {
    OWNER
    ADMIN
    MEMBER
  }

  type Query {
    # ----- Authentication Queries -----
    
    # Get current authenticated user with full profile info
    me: User!
    
    # Get current user's family with all members
    myFamily: Family!
    
    # Search families by name (for joining)
    searchFamilies(searchTerm: String!): [FamilySearchResult!]!

    # Get user's family join requests
    myJoinRequests: [FamilyJoinRequest!]!

  # Get incoming join requests for user's owned families (family owner only)
  incomingJoinRequests: [FamilyJoinRequest!]!
  # Get family members (family owner only)
  familyMembers: [User!]!

    # ----- Existing Queries -----
    
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
    # ----- Authentication Mutations -----
    
    # User registration with email verification
    register(input: RegisterInput!): RegistrationPayload!
    
    # User login with email and password
    login(input: LoginInput!): AuthPayload!
    
    # Refresh access token using refresh token
    refreshToken(token: String!): AuthPayload!
    
    # Logout current user (blacklists tokens)
    logout: Boolean!
    
    # Email verification
    sendVerificationEmail(email: String!): Boolean!
    verifyEmail(token: String!): Boolean!
    
    # Password reset
    requestPasswordReset(email: String!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    
    # Email change with double verification
    requestEmailChange(input: RequestEmailChangeInput!): Boolean!
    confirmEmailChange(token: String!): Boolean!
    
    # Family management
    createFamily(input: CreateFamilyInput!): Family!
    updateFamily(input: UpdateFamilyInput!): Family!
    joinFamilyByCode(inviteCode: String!): Family!
    leaveFamilyIfNotOwner: Boolean!
    
    # Family invitations (JWT-based)
    inviteToFamily(input: InviteFamilyInput!): Boolean!
    
    # Request to join a family (sends email to owner)
    requestJoinFamily(familyId: ID!): Boolean!

    # Respond to a family join request (OWNER only)
    respondToJoinRequest(input: RespondToJoinRequestInput!): FamilyJoinRequest!
    # Remove family member (OWNER only)
    removeFamilyMember(userId: ID!): Boolean!

    # ----- Existing Mutations -----
    
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

    # Mutations for User-related operations
    createUser(user: UserInput!): User!
    updateUser(user: UpdateUserInput!): User!
    deleteUser(id: ID!): ID!

    # Mutations for FamilyIncome-related operations
    createFamilyIncomes(familyIncomes: [FamilyIncomeInput!]!): [FamilyIncome!]!
    updateFamilyIncomes(updates: [UpdateFamilyIncomeInput!]!): [FamilyIncome!]!
    deleteFamilyIncomes(ids: [ID!]!): [ID!]!
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
    familyId: ID            # Reference to family (temporarily nullable)
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
    familyId: ID            # Reference to family (temporarily nullable)
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

  # Input type for creating a FamilyIncome record.
  input FamilyIncomeInput {
    date: String!              # ISO date string
    amount: Float!
    note: String
    periodicity: Periodicity!  # Must be one of the defined enum values
    typeId: ID!
    contributorId: ID!
    currencyId: ID!
  }

  # Input type for updating a FamilyIncome record.
  input UpdateFamilyIncomeInput {
    id: ID!
    date: String
    amount: Float
    note: String
    periodicity: Periodicity
    typeId: ID
    contributorId: ID
    currencyId: ID
  }

  # ----- User-related types and inputs -----

  # The User type with authentication and family management fields.
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String!       # Usually computed by concatenating first, middle, and last names.
    middleName: String      # Optional middle name.
    email: String!          # User's email address
    isEmailVerified: Boolean! # Whether email is verified
    isVerified: Boolean!    # Legacy field - kept for compatibility
    isActive: Boolean!      # Whether user account is active
    familyId: ID            # Reference to family (nullable during registration)
    roleInFamily: FamilyRole # Role in family: OWNER, ADMIN, MEMBER
    lastLoginAt: String     # Last login timestamp
    createdAt: String!      # Account creation timestamp
    updatedAt: String!      # Last update timestamp
  }

  input UserInput {
    firstName: String!
    middleName: String
    lastName: String!
  }

  input UpdateUserInput {
    id: ID!
    firstName: String
    middleName: String
    lastName: String
    # Additional fields can be added in the future.
  }

  # ----- Family-related types and inputs -----

  # Family represents a household or family unit for expense tracking
  type Family {
    id: ID!
    name: String!
    description: String
    owner: User!              # Family owner (resolved from ownerId)
    members: [User!]!         # All family members
    currency: Currency        # Family's default currency
    timezone: String!
    inviteCode: String        # Code for joining family
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  # Family search result for finding families to join
  type FamilySearchResult {
    id: ID!
    name: String!
    description: String
    memberCount: Int!
    owner: User!
  }

  # Enum for family join request status
  enum FamilyJoinRequestStatus {
    PENDING
    APPROVED
    REJECTED
    CANCELLED
  }

  # Family join request represents a request to join a family
  type FamilyJoinRequest {
    id: ID!
    user: User!                           # User who sent the request
    family: Family!                       # Family they want to join
    owner: User!                          # Family owner who will approve/reject
    status: FamilyJoinRequestStatus!      # Current status
    message: String                       # Optional message from requester
    requestedAt: String!                  # When request was sent
    respondedAt: String                   # When request was responded to
    responseMessage: String               # Optional response from owner
    isActive: Boolean!
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
    familyId: ID            # Reference to family (temporarily nullable)
    createdByUserId: ID     # Reference to user who created purchase (temporarily nullable)
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
    familyId: ID            # Reference to family (temporarily nullable)
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

  # ----- Authentication Input Types -----

  # Input for user registration
  input RegisterInput {
    firstName: String!
    lastName: String!
    middleName: String
    email: String!
    password: String!
    familyName: String        # If creating new family
    inviteCode: String        # If joining existing family
    invitationToken: String   # If accepting JWT invitation
  }

  # Input for user login
  input LoginInput {
    email: String!
    password: String!
  }

  # Input for password reset
  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  # Input for password change
  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  # Input for requesting email change
  input RequestEmailChangeInput {
    newEmail: String!
    currentPassword: String!
  }

  # Input for creating family
  input CreateFamilyInput {
    name: String!
    description: String
    currencyId: ID!
    timezone: String
  }

  # Input for updating family
  input UpdateFamilyInput {
    familyId: ID!
    name: String
    description: String
    currencyId: ID
    timezone: String
  }

  # Input for family invitation
  input InviteFamilyInput {
    email: String!
    role: FamilyRole!
    message: String
  }

  # Input for updating member role
  input UpdateMemberRoleInput {
    userId: ID!
    role: FamilyRole!
  }

  # Input for responding to family join request
  input RespondToJoinRequestInput {
    requestId: ID!
    response: FamilyJoinRequestResponse!
    message: String
  }

  # Enum for family join request responses
  enum FamilyJoinRequestResponse {
    APPROVE
    REJECT
  }

`;
