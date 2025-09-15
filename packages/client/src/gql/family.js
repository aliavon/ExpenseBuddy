import { gql } from '@apollo/client';

export const CREATE_FAMILY_MUTATION = gql`
  mutation CreateFamily($input: CreateFamilyInput!) {
    createFamily(input: $input) {
      id
      name
      description
    }
  }
`;

export const SEARCH_FAMILIES_QUERY = gql`
  query SearchFamilies($searchTerm: String!) {
    searchFamilies(searchTerm: $searchTerm) {
      id
      name
      description
      memberCount
      owner {
        firstName
        lastName
      }
    }
  }
`;

export const REQUEST_JOIN_FAMILY_MUTATION = gql`
  mutation RequestJoinFamily($familyId: ID!) {
    requestJoinFamily(familyId: $familyId)
  }
`;

export const MY_JOIN_REQUESTS_QUERY = gql`
  query MyJoinRequests {
    myJoinRequests {
      id
      family {
        id
        name
        description
      }
      owner {
        id
        firstName
        lastName
        email
      }
      status
      message
      requestedAt
      respondedAt
      responseMessage
      isActive
    }
  }
`;

export const INCOMING_JOIN_REQUESTS_QUERY = gql`
  query IncomingJoinRequests {
    incomingJoinRequests {
      id
      user {
        id
        firstName
        lastName
        email
      }
      family {
        id
        name
        description
      }
      status
      message
      requestedAt
      isActive
    }
  }
`;

export const RESPOND_TO_JOIN_REQUEST_MUTATION = gql`
  mutation RespondToJoinRequest($input: RespondToJoinRequestInput!) {
    respondToJoinRequest(input: $input) {
      id
      user {
        id
        firstName
        lastName
        email
      }
      family {
        id
        name
        description
      }
      status
      requestedAt
      respondedAt
      responseMessage
    }
  }
`;

export const FAMILY_MEMBERS_QUERY = gql`
  query FamilyMembers {
    familyMembers {
      id
      firstName
      lastName
      email
      roleInFamily
      createdAt
    }
  }
`;

export const REMOVE_FAMILY_MEMBER_MUTATION = gql`
  mutation RemoveFamilyMember($userId: ID!) {
    removeFamilyMember(userId: $userId)
  }
`;
