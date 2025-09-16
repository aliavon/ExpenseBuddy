import React from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE, KIND } from 'baseui/button';
import { LabelLarge, ParagraphSmall } from 'baseui/typography';
import { Avatar } from 'baseui/avatar';

const UserProfileHeader = ({ user, onLogoutClick }) => {
  const getInitials = () => {
    if (!user) {
      return 'U';
    }
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Block
      display="flex"
      alignItems="center"
      marginBottom="scale600"
      paddingBottom="scale600"
      borderBottom="1px solid #E0E0E0"
    >
      <Avatar
        name={getInitials()}
        size="scale1400"
        overrides={{
          Root: {
            style: {
              marginRight: '16px',
            },
          },
        }}
      />
      <Block flex="1">
        <Block
          display="flex" justifyContent="space-between"
          alignItems="center" marginBottom="scale200">
          <LabelLarge>
            {user?.firstName}
            {' '}
            {user?.lastName}
          </LabelLarge>
          <Button
            size={SIZE.mini}
            kind={KIND.secondary}
            onClick={onLogoutClick}
          >
            Logout
          </Button>
        </Block>
        <Block
          display="flex"
          alignItems="center"
          marginBottom="scale100"
        >
          <ParagraphSmall color="#666">
            {user?.email}
          </ParagraphSmall>
          <ParagraphSmall
            color={user?.isEmailVerified ? '#43A047' : '#FF9800'}
            marginLeft="scale200"
            fontSize="12px"
          >
            {user?.isEmailVerified ? '✓ Verified' : '⚠️ Not verified'}
          </ParagraphSmall>
        </Block>
      </Block>
    </Block>
  );
};

export default UserProfileHeader;
