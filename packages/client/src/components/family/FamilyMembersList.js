import React from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE, KIND } from 'baseui/button';
import { LabelMedium, ParagraphSmall, HeadingMedium } from 'baseui/typography';
import { Card, StyledBody } from 'baseui/card';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';
import { Avatar } from 'baseui/avatar';
import { ListItem, ListItemLabel } from 'baseui/list';
import { StyledDivider } from 'baseui/divider';

const FamilyMembersList = ({
  members,
  loading,
  isOwner,
  onRemoveMember,
}) => {
  const formatDate = dateString => {
    if (!dateString) {
      return 'Unknown';
    }
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName, lastName) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const getRoleBadgeColor = role => {
    switch (role) {
    case 'OWNER':
      return '#D44333';
    case 'ADMIN':
      return '#1E88E5';
    default:
      return '#43A047';
    }
  };

  return (
    <Card overrides={{ Root: { style: { marginBottom: '24px' } } }}>
      <StyledBody>
        <HeadingMedium marginBottom="scale600">
          Family Members (
          {members.length}
          )
        </HeadingMedium>

        {loading ? (
          <Block
            display="flex"
            justifyContent="center"
            padding="scale800"
          >
            <Spinner size={SPINNER_SIZE.medium} />
          </Block>
        ) : (
          <Block>
            {members.map(member => (
              <Block key={member.id} marginBottom="scale400">
                <ListItem
                  overrides={{
                    Content: {
                      style: {
                        paddingTop: '12px',
                        paddingBottom: '12px',
                      },
                    },
                  }}
                >
                  <Block
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                  >
                    <Block display="flex" alignItems="center">
                      <Avatar
                        name={getInitials(member.firstName, member.lastName)}
                        size="scale1000"
                        overrides={{
                          Root: {
                            style: {
                              marginRight: '16px',
                            },
                          },
                        }}
                      />
                      <Block>
                        <ListItemLabel>
                          {member.firstName}
                          {' '}
                          {member.lastName}
                          {member.roleInFamily === 'OWNER' && ' 👑'}
                        </ListItemLabel>
                        <ParagraphSmall color="#666">
                          {member.email}
                          {' '}
                          •
                          {' '}
                          {member.roleInFamily}
                          {' '}
                          • Joined
                          {' '}
                          {formatDate(member.createdAt)}
                        </ParagraphSmall>
                      </Block>
                    </Block>

                    <Block
                      display="flex"
                      alignItems="center"
                      gap="scale400"
                    >
                      <Block
                        backgroundColor={getRoleBadgeColor(member.roleInFamily)}
                        color="white"
                        paddingTop="scale200"
                        paddingBottom="scale200"
                        paddingLeft="scale400"
                        paddingRight="scale400"
                        borderRadius="16px"
                      >
                        <ParagraphSmall margin="0" color="white">
                          {member.roleInFamily}
                        </ParagraphSmall>
                      </Block>

                      {isOwner && member.roleInFamily !== 'OWNER' && (
                        <Button
                          size={SIZE.compact}
                          kind={KIND.tertiary}
                          onClick={() => onRemoveMember(member)}
                        >
                          Remove
                        </Button>
                      )}
                    </Block>
                  </Block>
                </ListItem>
                {member !== members[members.length - 1] && <StyledDivider />}
              </Block>
            ))}
          </Block>
        )}
      </StyledBody>
    </Card>
  );
};

export default FamilyMembersList;
