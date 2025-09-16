import React from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE, KIND } from 'baseui/button';
import { LabelMedium } from 'baseui/typography';

const PersonalSettingsButtons = ({
  onEditProfileClick,
  onChangePasswordClick,
  onChangeEmailClick,
}) => (
  <Block marginTop="scale600">
    <LabelMedium marginBottom="scale600">Personal Settings</LabelMedium>

    <Block marginBottom="scale400">
      <Button
        size={SIZE.default}
        kind={KIND.tertiary}
        onClick={onEditProfileClick}
        overrides={{
          BaseButton: {
            style: {
              width: '100%',
              justifyContent: 'flex-start',
            },
          },
        }}
      >
        ✏️ Edit Personal Information
      </Button>
    </Block>

    <Block marginBottom="scale400">
      <Button
        size={SIZE.default}
        kind={KIND.tertiary}
        onClick={onChangePasswordClick}
        overrides={{
          BaseButton: {
            style: {
              width: '100%',
              justifyContent: 'flex-start',
            },
          },
        }}
      >
        🔒 Change Password
      </Button>
    </Block>

    <Block marginBottom="scale400">
      <Button
        size={SIZE.default}
        kind={KIND.tertiary}
        onClick={onChangeEmailClick}
        overrides={{
          BaseButton: {
            style: {
              width: '100%',
              justifyContent: 'flex-start',
            },
          },
        }}
      >
        📧 Change Email Address
      </Button>
    </Block>
  </Block>
);

export default PersonalSettingsButtons;
