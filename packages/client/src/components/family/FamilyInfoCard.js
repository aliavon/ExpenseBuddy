import React from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE, KIND } from 'baseui/button';
import { LabelMedium, ParagraphSmall, HeadingMedium } from 'baseui/typography';
import { Card, StyledBody } from 'baseui/card';

const FamilyInfoCard = ({ user, members, isOwner, onEditClick }) => {
  const formatDate = dateString => {
    if (!dateString) {
      return 'Unknown';
    }
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card overrides={{ Root: { style: { marginBottom: '24px' } } }}>
      <StyledBody>
        <Block
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          marginBottom="scale600"
        >
          <HeadingMedium marginBottom="scale400">
            {user?.family?.name || 'Your Family'}
          </HeadingMedium>
          {isOwner && (
            <Button
              size={SIZE.compact}
              kind={KIND.tertiary}
              onClick={onEditClick}
            >
              Edit Family Info
            </Button>
          )}
        </Block>

        <Block
          display="flex"
          flexWrap
          marginBottom="scale600"
        >
          <Block marginRight="scale800" marginBottom="scale400">
            <LabelMedium color="#666">Description</LabelMedium>
            <ParagraphSmall>
              {user?.family?.description || 'No description provided'}
            </ParagraphSmall>
          </Block>
          <Block marginRight="scale800" marginBottom="scale400">
            <LabelMedium color="#666">Members</LabelMedium>
            <ParagraphSmall>
              {members?.length || 0}
              {' '}
              members
            </ParagraphSmall>
          </Block>
          <Block marginBottom="scale400">
            <LabelMedium color="#666">Created</LabelMedium>
            <ParagraphSmall>{formatDate(user?.family?.createdAt)}</ParagraphSmall>
          </Block>
        </Block>
      </StyledBody>
    </Card>
  );
};

export default FamilyInfoCard;
