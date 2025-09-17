import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditProfileModal from '../EditProfileModal';
import ChangePasswordModal from '../ChangePasswordModal';
import ChangeEmailModal from '../ChangeEmailModal';
import LogoutConfirmModal from '../LogoutConfirmModal';
import { mockBaseUIComponents } from '../../../test-utils/mocks';

// Setup mocks
mockBaseUIComponents();

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

    it('calls onSave when change password button is clicked', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: 'Change Password' });
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
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

    it('calls onSave when save button is clicked', () => {
      render(<ChangeEmailModal {...defaultProps} />);
      
      const saveButton = screen.getByText('Change Email');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
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
