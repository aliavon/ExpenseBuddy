import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditProfileModal from '../EditProfileModal';
import ChangePasswordModal from '../ChangePasswordModal';
import ChangeEmailModal from '../ChangeEmailModal';
import LogoutConfirmModal from '../LogoutConfirmModal';

describe('Profile Modals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EditProfileModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      profileData: {
        firstName: 'John',
        lastName: 'Doe',
        middleName: '',
      },
      onProfileChange: jest.fn(),
      onSave: jest.fn(),
      loading: false,
    };

    it('renders and handles form changes', () => {
      render(<EditProfileModal {...defaultProps} />);

      expect(screen.getByText('Edit Personal Information')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
      
      expect(defaultProps.onProfileChange).toHaveBeenCalledWith('firstName', 'Jane');
    });

    it('handles lastName input changes - line 35', () => {
      render(<EditProfileModal {...defaultProps} />);

      const lastNameInput = screen.getByDisplayValue('Doe');
      fireEvent.change(lastNameInput, { target: { value: 'Smith' } });
      
      expect(defaultProps.onProfileChange).toHaveBeenCalledWith('lastName', 'Smith');
    });

    it('handles middleName input changes - line 43', () => {
      const propsWithMiddleName = {
        ...defaultProps,
        profileData: {
          ...defaultProps.profileData,
          middleName: 'William'
        }
      };
      
      render(<EditProfileModal {...propsWithMiddleName} />);

      const middleNameInput = screen.getByDisplayValue('William');
      fireEvent.change(middleNameInput, { target: { value: 'James' } });
      
      expect(defaultProps.onProfileChange).toHaveBeenCalledWith('middleName', 'James');
    });

    it('handles empty middleName input - line 43', () => {
      render(<EditProfileModal {...defaultProps} />);

      const middleNameInput = screen.getByPlaceholderText('Enter middle name...');
      fireEvent.change(middleNameInput, { target: { value: 'Robert' } });
      
      expect(defaultProps.onProfileChange).toHaveBeenCalledWith('middleName', 'Robert');
    });

    it('calls onSave when save button is clicked', () => {
      render(<EditProfileModal {...defaultProps} />);
      
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('does not render when closed', () => {
      render(<EditProfileModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Edit Personal Information')).not.toBeInTheDocument();
    });
  });

  describe('ChangePasswordModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      passwordData: {
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      },
      onPasswordChange: jest.fn(),
      onSave: jest.fn(),
      loading: false,
    };

    it('renders password form', () => {
      render(<ChangePasswordModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'dialog');
      expect(screen.getByPlaceholderText('Enter current password...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter new password (min 8 characters)...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm new password...')).toBeInTheDocument();
    });

    it('handles password input changes', () => {
      render(<ChangePasswordModal {...defaultProps} />);

      const currentPasswordInput = screen.getByPlaceholderText('Enter current password...');
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
      
      expect(defaultProps.onPasswordChange).toHaveBeenCalledWith('currentPassword', 'oldpass');
    });

    it('handles newPassword input changes - line 41', () => {
      render(<ChangePasswordModal {...defaultProps} />);

      const newPasswordInput = screen.getByPlaceholderText('Enter new password (min 8 characters)...');
      fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
      
      expect(defaultProps.onPasswordChange).toHaveBeenCalledWith('newPassword', 'newpass123');
    });

    it('handles confirmPassword input changes - line 50', () => {
      render(<ChangePasswordModal {...defaultProps} />);

      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password...');
      fireEvent.change(confirmPasswordInput, { target: { value: 'confirm123' } });
      
      expect(defaultProps.onPasswordChange).toHaveBeenCalledWith('confirmPassword', 'confirm123');
    });

    it('calls onSave when change password button is clicked', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: 'Change Password' });
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('shows password mismatch warning - lines 54-60', () => {
      const propsWithMismatchedPasswords = {
        ...defaultProps,
        passwordData: {
          currentPassword: 'current',
          newPassword: 'newpass123',
          confirmPassword: 'different123'
        }
      };
      
      render(<ChangePasswordModal {...propsWithMismatchedPasswords} />);
      
      // Should show "Passwords do not match" when new password and confirm password are different
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('hides password mismatch warning when passwords match - lines 54-60', () => {
      const propsWithMatchedPasswords = {
        ...defaultProps,
        passwordData: {
          currentPassword: 'current',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123'
        }
      };
      
      render(<ChangePasswordModal {...propsWithMatchedPasswords} />);
      
      // Should NOT show "Passwords do not match" when passwords match
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });

    it('hides password mismatch warning when fields are empty - lines 54-60', () => {
      const propsWithEmptyPasswords = {
        ...defaultProps,
        passwordData: {
          currentPassword: 'current',
          newPassword: '',
          confirmPassword: ''
        }
      };
      
      render(<ChangePasswordModal {...propsWithEmptyPasswords} />);
      
      // Should NOT show "Passwords do not match" when fields are empty
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });

    it('shows loading state on button - line 86', () => {
      const loadingProps = {
        ...defaultProps,
        loading: true
      };
      
      render(<ChangePasswordModal {...loadingProps} />);
      
      // Should show "Changing..." when loading
      expect(screen.getByText('Changing...')).toBeInTheDocument();
    });

    it('shows normal state on button - line 86', () => {
      const normalProps = {
        ...defaultProps,
        loading: false
      };
      
      render(<ChangePasswordModal {...normalProps} />);
      
      // Should show "Change Password" button when not loading
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
    });

    it('shows password length validation warning - line 60', () => {
      const propsWithShortPassword = {
        ...defaultProps,
        passwordData: {
          currentPassword: 'current',
          newPassword: '1234567', // 7 characters - less than 8
          confirmPassword: '1234567'
        }
      };
      
      render(<ChangePasswordModal {...propsWithShortPassword} />);
      
      // Should show "Password must be at least 8 characters long" when password is too short
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    it('hides password length validation warning when password is long enough - line 60', () => {
      const propsWithValidPassword = {
        ...defaultProps,
        passwordData: {
          currentPassword: 'current',
          newPassword: '12345678', // exactly 8 characters
          confirmPassword: '12345678'
        }
      };
      
      render(<ChangePasswordModal {...propsWithValidPassword} />);
      
      // Should NOT show length warning when password is 8+ characters
      expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
    });
  });

  describe('ChangeEmailModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      user: {
        email: 'test@example.com',
        isEmailVerified: true,
      },
      emailData: {
        newEmail: 'new@example.com',
        currentPassword: 'currentpass',
      },
      onEmailChange: jest.fn(),
      onSave: jest.fn(),
      loading: false,
    };

    it('renders email change form', () => {
      render(<ChangeEmailModal {...defaultProps} />);

      expect(screen.getByText('Change Email Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter new email address...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter current password to confirm...')).toBeInTheDocument();
    });

    it('handles email input changes', () => {
      render(<ChangeEmailModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('Enter new email address...');
      fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
      
      expect(defaultProps.onEmailChange).toHaveBeenCalledWith('newEmail', 'new@email.com');
    });

    it('handles currentPassword input changes - line 48', () => {
      render(<ChangeEmailModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('Enter current password to confirm...');
      fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });
      
      expect(defaultProps.onEmailChange).toHaveBeenCalledWith('currentPassword', 'mypassword123');
    });

    it('calls onSave when save button is clicked', () => {
      render(<ChangeEmailModal {...defaultProps} />);
      
      const saveButton = screen.getByText('Change Email');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('shows verified email status - line 31', () => {
      const propsWithVerifiedEmail = {
        ...defaultProps,
        user: {
          email: 'verified@test.com',
          isEmailVerified: true
        }
      };
      
      render(<ChangeEmailModal {...propsWithVerifiedEmail} />);
      
      // Should show "✓ Verified" for verified email
      expect(screen.getByText(/✓ Verified/)).toBeInTheDocument();
    });

    it('shows unverified email status - line 31', () => {
      const propsWithUnverifiedEmail = {
        ...defaultProps,
        user: {
          email: 'unverified@test.com', 
          isEmailVerified: false
        }
      };
      
      render(<ChangeEmailModal {...propsWithUnverifiedEmail} />);
      
      // Should show "⚠️ Not verified" for unverified email
      expect(screen.getByText(/⚠️ Not verified/)).toBeInTheDocument();
    });

    it('shows loading state on button - line 73', () => {
      const loadingProps = {
        ...defaultProps,
        loading: true
      };
      
      render(<ChangeEmailModal {...loadingProps} />);
      
      // Should show "Processing..." when loading
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('shows normal state on button - line 73', () => {
      const normalProps = {
        ...defaultProps,
        loading: false
      };
      
      render(<ChangeEmailModal {...normalProps} />);
      
      // Should show "Change Email" when not loading
      expect(screen.getByText('Change Email')).toBeInTheDocument();
    });
  });

  describe('LogoutConfirmModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onConfirm: jest.fn(),
      loading: false,
    };

    it('renders confirmation message', () => {
      render(<LogoutConfirmModal {...defaultProps} />);

      expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to logout/)).toBeInTheDocument();
    });

    it('calls onConfirm when logout button is clicked', () => {
      render(<LogoutConfirmModal {...defaultProps} />);
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
      render(<LogoutConfirmModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('shows logout button', () => {
      render(<LogoutConfirmModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });
  });

  // Test modal close functionality
  describe('Modal Close Behavior', () => {
    it('all modals call onClose when close button is clicked', () => {
      const onClose = jest.fn();

      const modals = [
        <EditProfileModal key="edit" isOpen={true} onClose={onClose} profileData={{firstName: 'John', lastName: 'Doe', middleName: ''}} onProfileChange={jest.fn()} onSave={jest.fn()} />,
        <ChangePasswordModal key="password" isOpen={true} onClose={onClose} passwordData={{currentPassword: '', newPassword: '', confirmPassword: ''}} onPasswordChange={jest.fn()} onSave={jest.fn()} />,
        <ChangeEmailModal key="email" isOpen={true} onClose={onClose} user={{email: 'test@example.com', isEmailVerified: true}} emailData={{newEmail: '', currentPassword: ''}} onEmailChange={jest.fn()} onSave={jest.fn()} />,
        <LogoutConfirmModal key="logout" isOpen={true} onClose={onClose} onConfirm={jest.fn()} />,
      ];

      modals.forEach((modal, index) => {
        const { unmount } = render(modal);
        
        // Wait for modal to render
        const closeButton = screen.getByLabelText('Close');
        fireEvent.click(closeButton);
        
        expect(onClose).toHaveBeenCalled();
        onClose.mockClear();
        unmount();
      });
    });
  });

  // Test loading states
  describe('Loading States', () => {
    it('disables buttons when loading', () => {
      const loadingProps = { loading: true };

      render(<EditProfileModal isOpen={true} onClose={jest.fn()} profileData={{}} onProfileChange={jest.fn()} onSave={jest.fn()} {...loadingProps} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });
});
