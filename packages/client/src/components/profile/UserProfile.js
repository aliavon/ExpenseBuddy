import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { toaster } from 'baseui/toast';
import { Drawer, ANCHOR } from 'baseui/drawer';
import { StyledDivider } from 'baseui/divider';

import { useAuth } from '../../contexts/AuthContext';
import { UPDATE_PROFILE_MUTATION, CHANGE_PASSWORD_MUTATION, REQUEST_EMAIL_CHANGE_MUTATION } from '../../gql/auth';

// Import components
import UserProfileHeader from './UserProfileHeader';
import FamilyInfoSection from './FamilyInfoSection';
import PersonalSettingsButtons from './PersonalSettingsButtons';
import LogoutConfirmModal from './LogoutConfirmModal';
import EditProfileModal from './EditProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import ChangeEmailModal from './ChangeEmailModal';

const UserProfile = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // GraphQL mutations
  const [updateProfile, { loading: updateProfileLoading }] = useMutation(UPDATE_PROFILE_MUTATION, {
    refetchQueries: ['Me'], // Refetch ME_QUERY to update user data everywhere (now reactive!)
    awaitRefetchQueries: true, // Wait for refetch to complete
    onCompleted: data => {
      toaster.positive('Profile updated successfully!');
      setShowEditProfile(false);
      // Reset form with updated data
      setEditedProfile({
        firstName: data.updateUser.firstName || '',
        lastName: data.updateUser.lastName || '',
        middleName: data.updateUser.middleName || '',
      });
    },
    onError: error => {
      console.error('Profile update error:', error);
      toaster.negative(`Profile update failed: ${error.message}`);
    },
  });

  const [changePassword, { loading: changePasswordLoading }] = useMutation(CHANGE_PASSWORD_MUTATION, {
    onCompleted: () => {
      toaster.positive('Password changed successfully!');
      setShowChangePassword(false);
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: error => {
      console.error('Password change error:', error);
      toaster.negative(`Password change failed: ${error.message}`);
    },
  });

  const [requestEmailChange, { loading: emailChangeLoading }] = useMutation(REQUEST_EMAIL_CHANGE_MUTATION, {
    onCompleted: () => {
      toaster.positive('Email change request sent! Check both your current and new email addresses.');
      setShowChangeEmail(false);
      // Reset form
      setEmailForm({
        newEmail: '',
        currentPassword: '',
      });
    },
    onError: error => {
      console.error('Email change request error:', error);
      toaster.negative(`Email change failed: ${error.message}`);
    },
  });

  // Modal states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  // Form states
  const [editedProfile, setEditedProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    middleName: user?.middleName || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: '',
  });

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      toaster.positive('Successfully logged out');
      navigate('/login');
      onClose();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
      toaster.negative('Logout error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        variables: {
          user: {
            id: user.id,
            firstName: editedProfile.firstName.trim(),
            lastName: editedProfile.lastName.trim(),
            middleName: editedProfile.middleName.trim(),
          },
        },
      });
    } catch (error) {
      // Error is handled in onError callback
      console.error('Profile update error:', error);
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          },
        },
      });
    } catch (error) {
      // Error is handled in onError callback
      console.error('Password change error:', error);
    }
  };

  const handleChangeEmail = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      toaster.negative('Please enter a valid email address');
      return;
    }

    // Check if new email is different from current
    if (emailForm.newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toaster.negative('New email must be different from current email');
      return;
    }

    if (!emailForm.currentPassword) {
      toaster.negative('Current password is required');
      return;
    }

    try {
      await requestEmailChange({
        variables: {
          input: {
            newEmail: emailForm.newEmail,
            currentPassword: emailForm.currentPassword,
          },
        },
      });
    } catch (error) {
      // Error is handled in onError callback
      console.error('Email change request error:', error);
    }
  };

  const handleDashboardClick = () => {
    navigate('/family');
    onClose();
  };

  const handleProfileChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmailChange = (field, value) => {
    setEmailForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        anchor={ANCHOR.right}
        overrides={{
          DrawerContainer: {
            style: {
              width: '400px',
              maxWidth: '90vw',
            },
          },
        }}
      >
        <Block
          padding="scale600"
          height="100vh"
          overflow="auto"
        >
          {/* Header with User Info */}
          <UserProfileHeader
            user={user}
            onLogoutClick={() => setShowLogoutConfirm(true)}
          />

          {/* Family Info Section */}
          <FamilyInfoSection
            user={user}
            onDashboardClick={handleDashboardClick}
          />

          <StyledDivider />

          {/* Personal Settings Buttons */}
          <PersonalSettingsButtons
            onEditProfileClick={() => setShowEditProfile(true)}
            onChangePasswordClick={() => setShowChangePassword(true)}
            onChangeEmailClick={() => setShowChangeEmail(true)}
          />
        </Block>
      </Drawer>

      {/* All Modals - Outside drawer for proper z-index */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={editedProfile}
        onProfileChange={handleProfileChange}
        onSave={handleSaveProfile}
        loading={updateProfileLoading}
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        passwordData={passwordForm}
        onPasswordChange={handlePasswordChange}
        onSave={handleChangePassword}
        loading={changePasswordLoading}
      />

      <ChangeEmailModal
        isOpen={showChangeEmail}
        onClose={() => setShowChangeEmail(false)}
        user={user}
        emailData={emailForm}
        onEmailChange={handleEmailChange}
        onSave={handleChangeEmail}
        loading={emailChangeLoading}
      />
    </>
  );
};

export default UserProfile;
