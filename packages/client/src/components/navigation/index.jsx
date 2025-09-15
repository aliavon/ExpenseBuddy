import React, { useState } from 'react';
import { Navigation } from 'baseui/side-navigation';
import { useLocation, useNavigate } from 'react-router-dom';
import { Block } from 'baseui/block';
import { Button, SIZE } from 'baseui/button';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Avatar } from 'baseui/avatar';
import { toaster } from 'baseui/toast';

import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../profile/UserProfile';

const navItems = [
  {
    title: 'Add Purchases',
    itemId: '/add',
  }, {
    title: 'View Purchases',
    itemId: '/view',
  }, {
    title: 'Family Income',
    itemId: '/income',
  },
];

const SideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleNavChange = ({ event, item }) => {
    event.preventDefault();
    navigate(item.itemId);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toaster.positive('Successfully logged out');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toaster.negative('Logout error');
    }
  };

  if (navItems.length === 1) {
    return null;
  }

  return (
    <Block
      height="100%"
      backgroundColor="primary50"
      display="flex"
      flexDirection="column"
    >
      {/* User info section - clickable */}
      <Block
        padding="scale600"
        borderBottom="1px solid"
        borderColor="primary100"
      >
        <Block
          display="flex"
          alignItems="center"
          marginBottom="scale400"
          onClick={() => setIsProfileOpen(true)}
          style={{
            cursor: 'pointer',
            ':hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            },
          }}
          padding="scale300"
          borderRadius="scale200"
          $hover={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <Avatar
            name={user ? `${user.firstName} ${user.lastName}` : 'User'}
            size="scale1000"
          />
          <Block marginLeft="scale400" flex="1">
            <LabelMedium>
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </LabelMedium>
            <ParagraphSmall color="contentSecondary">
              {user?.family?.name || 'Loading...'}
            </ParagraphSmall>
            <ParagraphSmall color="contentSecondary">
              {user?.roleInFamily || ''}
            </ParagraphSmall>
          </Block>
          <ParagraphSmall color="contentSecondary">
            ⚙️
          </ParagraphSmall>
        </Block>

      </Block>

      {/* Navigation */}
      <Block flex="1">
        <Navigation
          items={navItems}
          activeItemId={location.pathname}
          onChange={handleNavChange}
        />
      </Block>

      {/* User Profile Sidebar */}
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </Block>
  );
};
export default SideNav;
