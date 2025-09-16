import React from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE, KIND } from 'baseui/button';
import { LabelMedium, ParagraphSmall, HeadingMedium } from 'baseui/typography';
import { Card, StyledBody } from 'baseui/card';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';
import { Avatar } from 'baseui/avatar';
import { Textarea } from 'baseui/textarea';

const JoinRequestsSection = ({
  requests,
  loading,
  responseMessages,
  onResponseMessageChange,
  onHandleRequest,
  respondLoading,
}) => {
  const formatDate = dateString => {
    if (!dateString) {
      return 'Unknown';
    }
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName, lastName) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <Card>
      <StyledBody>
        <HeadingMedium marginBottom="scale600">
          Join Requests (
          {requests.length}
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
        ) : requests.length === 0 ? (
          <ParagraphSmall color="#666">
            No pending join requests
          </ParagraphSmall>
        ) : (
          <Block>
            {requests.map(request => (
              <Block key={request.id} marginBottom="scale600">
                <Block
                  backgroundColor="#F7F7F7"
                  padding="scale600"
                  borderRadius="8px"
                >
                  <Block
                    display="flex"
                    alignItems="center"
                    marginBottom="scale400"
                  >
                    <Avatar
                      name={getInitials(request.user.firstName, request.user.lastName)}
                      size="scale800"
                      overrides={{
                        Root: {
                          style: {
                            marginRight: '12px',
                          },
                        },
                      }}
                    />
                    <Block>
                      <LabelMedium>
                        {request.user.firstName}
                        {' '}
                        {request.user.lastName}
                      </LabelMedium>
                      <ParagraphSmall color="#666">
                        {request.user.email}
                        {' '}
                        •
                        {' '}
                        {formatDate(request.requestedAt)}
                      </ParagraphSmall>
                    </Block>
                  </Block>

                  {request.message && (
                    <Block marginBottom="scale400">
                      <LabelMedium>Message:</LabelMedium>
                      <ParagraphSmall>
                        &quot;
                        {request.message}
                        &quot;
                      </ParagraphSmall>
                    </Block>
                  )}

                  <Block marginBottom="scale400">
                    <Textarea
                      value={responseMessages[request.id] || ''}
                      onChange={e => onResponseMessageChange(request.id, e.target.value)}
                      placeholder="Optional response message..."
                      rows={2}
                    />
                  </Block>

                  <Block display="flex" gap="scale400">
                    <Button
                      size={SIZE.compact}
                      onClick={() => onHandleRequest(request.id, 'APPROVED')}
                      isLoading={respondLoading}
                    >
                      Approve
                    </Button>
                    <Button
                      size={SIZE.compact}
                      kind={KIND.tertiary}
                      onClick={() => onHandleRequest(request.id, 'REJECTED')}
                      isLoading={respondLoading}
                    >
                      Reject
                    </Button>
                  </Block>
                </Block>
              </Block>
            ))}
          </Block>
        )}
      </StyledBody>
    </Card>
  );
};

export default JoinRequestsSection;
