import { gql } from '@apollo/client';

// Request password reset mutation
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

// Reset password mutation
export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

// Update user profile mutation
export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateUser($user: UpdateUserInput!) {
    updateUser(user: $user) {
      id
      firstName
      middleName
      lastName
      email
      isEmailVerified
      familyId
      roleInFamily
    }
  }
`;

// Change password mutation
export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

// Request email change mutation
export const REQUEST_EMAIL_CHANGE_MUTATION = gql`
  mutation RequestEmailChange($input: RequestEmailChangeInput!) {
    requestEmailChange(input: $input)
  }
`;

// Confirm email change mutation
export const CONFIRM_EMAIL_CHANGE_MUTATION = gql`
  mutation ConfirmEmailChange($token: String!) {
    confirmEmailChange(token: $token)
  }
`;
