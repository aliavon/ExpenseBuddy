import React from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE } from 'baseui/button';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Card, StyledBody } from 'baseui/card';

const FamilyInfoSection = ({ user, onDashboardClick }) => {
  if (!user?.family) {
    return null;
  }

  return (
    <Card overrides={{ Root: { style: { marginBottom: '24px' } } }}>
      <StyledBody>
        <Block
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Block>
            <LabelMedium marginBottom="scale200">Current Family</LabelMedium>
            <ParagraphSmall marginBottom="scale100">
              <strong>Family Member</strong>
            </ParagraphSmall>
            <ParagraphSmall color="#666">
              Your role:
              {' '}
              {user.roleInFamily}
            </ParagraphSmall>
          </Block>
          <Button
            size={SIZE.compact}
            onClick={onDashboardClick}
          >
            Dashboard
          </Button>
        </Block>
      </StyledBody>
    </Card>
  );
};

export default FamilyInfoSection;
