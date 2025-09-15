import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { Button, SIZE, KIND } from 'baseui/button';
import { LabelMedium, LabelLarge, ParagraphSmall } from 'baseui/typography';
import { Avatar } from 'baseui/avatar';
import { toaster } from 'baseui/toast';
import { Drawer, ANCHOR } from 'baseui/drawer';
import { Card, StyledBody } from 'baseui/card';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';
import { Textarea } from 'baseui/textarea';

import { useAuth } from '../../contexts/AuthContext';
import {
  FAMILY_MEMBERS_QUERY,
  REMOVE_FAMILY_MEMBER_MUTATION,
  INCOMING_JOIN_REQUESTS_QUERY,
  RESPOND_TO_JOIN_REQUEST_MUTATION,
} from '../../gql/family';

const UserProfile = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [responseMessages, setResponseMessages] = useState({});

  const isOwner = user?.roleInFamily === 'OWNER';

  // Fetch family members (only for owners)
  const { data: membersData, loading: membersLoading, refetch: refetchMembers } = useQuery(FAMILY_MEMBERS_QUERY, {
    skip: !isOwner || !isOpen, // Only fetch if owner and drawer is open
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    onError: error => {
      console.error('Failed to fetch family members:', error);
      // Don't show error to user unless it's critical
    },
  });

  // Fetch incoming join requests (only for owners)
  const { data: requestsData, loading: requestsLoading, refetch: refetchRequests } = useQuery(INCOMING_JOIN_REQUESTS_QUERY, {
    skip: !isOwner || !isOpen, // Only fetch if owner and drawer is open
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    onError: error => {
      console.error('Failed to fetch incoming join requests:', error);
      // Don't show error to user unless it's critical
    },
  });

  const familyMembers = membersData?.familyMembers || [];
  const incomingRequests = requestsData?.incomingJoinRequests || [];

  // Mutation for removing family member
  const [removeFamilyMemberMutation] = useMutation(REMOVE_FAMILY_MEMBER_MUTATION, {
    onCompleted: () => {
      toaster.positive('Family member removed successfully');
      setMemberToRemove(null);
      refetchMembers(); // Refresh the members list
    },
    onError: error => {
      console.error('Error removing family member:', error);
      toaster.negative(error.message || 'Failed to remove family member. Please try again.');
      setMemberToRemove(null);
    },
  });

  // Mutation for responding to join requests
  const [respondToRequest] = useMutation(RESPOND_TO_JOIN_REQUEST_MUTATION, {
    onCompleted: data => {
      const { status } = data.respondToJoinRequest;
      const userName = `${data.respondToJoinRequest.user.firstName} ${data.respondToJoinRequest.user.lastName}`;

      if (status === 'APPROVED') {
        toaster.positive(`${userName} has been approved and added to your family!`);
        refetchMembers(); // Refresh members list when someone is approved
      } else {
        toaster.info(`${userName}'s request has been rejected.`);
      }

      refetchRequests(); // Refresh the requests list

      // Clear the response message for this request
      setResponseMessages(prev => {
        const newState = { ...prev };
        delete newState[data.respondToJoinRequest.id];
        return newState;
      });
    },
    onError: error => {
      console.error('Error responding to join request:', error);
      toaster.negative(error.message || 'Failed to respond to request. Please try again.');
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      toaster.positive('Successfully logged out');
      navigate('/login');
      onClose(); // Close the sidebar
    } catch (error) {
      console.error('Logout error:', error);
      toaster.negative('Logout error');
    }
  };

  const handleRemoveMember = async userId => {
    if (memberToRemove === userId) {
      // Confirm removal
      try {
        await removeFamilyMemberMutation({
          variables: { userId },
        });
      } catch (error) {
        // Error handled by onError callback
      }
    } else {
      // Show confirmation
      setMemberToRemove(userId);
    }
  };

  const handleJoinRequestResponse = async (requestId, response) => {
    const message = responseMessages[requestId] || '';

    try {
      await respondToRequest({
        variables: {
          input: {
            requestId,
            response,
            message,
          },
        },
      });
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const handleMessageChange = (requestId, value) => {
    setResponseMessages(prev => ({
      ...prev,
      [requestId]: value,
    }));
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      anchor={ANCHOR.right}
    >
      {/* Header */}
      <Block
        padding="scale800"
        borderBottom="1px solid"
        borderColor="borderOpaque"
      >
        <Block
          display="flex" justifyContent="space-between"
          alignItems="center">
          <LabelLarge>Profile</LabelLarge>
        </Block>
      </Block>

      {/* User Info */}
      <Block
        padding="scale800"
        borderBottom="1px solid"
        borderColor="borderOpaque"
      >
        <Block
          display="flex" alignItems="center"
          marginBottom="scale600">
          <Avatar
            name={user ? `${user.firstName} ${user.lastName}` : 'User'}
            size="scale1200"
          />
          <Block marginLeft="scale600">
            <LabelMedium>
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </LabelMedium>
            <ParagraphSmall color="contentSecondary">
              {user?.email}
            </ParagraphSmall>
            <ParagraphSmall color="contentSecondary">
              {user?.roleInFamily}
              {' '}
              {user?.familyId && '• Family Member'}
            </ParagraphSmall>
          </Block>
        </Block>
      </Block>

      {/* Navigation Tabs */}
      <Block padding="scale600">
        <Block
          display="flex" flexDirection="column"
          gridGap="scale300">
          <Button
            kind={activeTab === 'profile' ? 'primary' : 'secondary'}
            size={SIZE.compact}
            onClick={() => setActiveTab('profile')}
            overrides={{ Root: { style: { justifyContent: 'flex-start' } } }}
          >
            👤 Profile Settings
          </Button>

          {isOwner && (
            <Button
              kind={activeTab === 'admin' ? 'primary' : 'secondary'}
              size={SIZE.compact}
              onClick={() => setActiveTab('admin')}
              overrides={{ Root: { style: { justifyContent: 'flex-start' } } }}
            >
              👑 Family Admin
            </Button>
          )}

          <Button
            kind={activeTab === 'family' ? 'primary' : 'secondary'}
            size={SIZE.compact}
            onClick={() => setActiveTab('family')}
            overrides={{ Root: { style: { justifyContent: 'flex-start' } } }}
          >
            👨‍👩‍👧‍👦 Family Info
          </Button>
        </Block>
      </Block>

      {/* Content Area */}
      <Block
        flex="1"
        padding="scale600"
        overflow="auto"
      >
        {activeTab === 'profile' && (
          <Block>
            <LabelMedium marginBottom="scale600">Profile Information</LabelMedium>
            <Block marginBottom="scale400">
              <ParagraphSmall>
                <strong>First Name:</strong>
                {' '}
                {user?.firstName}
              </ParagraphSmall>
            </Block>
            <Block marginBottom="scale400">
              <ParagraphSmall>
                <strong>Last Name:</strong>
                {' '}
                {user?.lastName}
              </ParagraphSmall>
            </Block>
            <Block marginBottom="scale400">
              <ParagraphSmall>
                <strong>Middle Name:</strong>
                {' '}
                {user?.middleName || 'Not specified'}
              </ParagraphSmall>
            </Block>
            <Block marginBottom="scale400">
              <ParagraphSmall>
                <strong>Email:</strong>
                {' '}
                {user?.email}
              </ParagraphSmall>
            </Block>
            <Block marginBottom="scale400">
              <ParagraphSmall>
                <strong>Email Verified:</strong>
                {' '}
                {user?.isEmailVerified ? 'Yes' : 'No'}
              </ParagraphSmall>
            </Block>
          </Block>
        )}

        {activeTab === 'admin' && isOwner && (
          <Block>
            <LabelMedium marginBottom="scale800">Family Administration</LabelMedium>

            {/* Family Members Section */}
            <Block marginBottom="scale800">
              <LabelMedium marginBottom="scale600">
                Family Members (
                {familyMembers.length}
                )
              </LabelMedium>

              {membersLoading ? (
                <Block
                  display="flex" alignItems="center"
                  justifyContent="center" padding="scale400">
                  <Spinner size={SPINNER_SIZE.small} />
                  <ParagraphSmall marginLeft="scale300">Loading members...</ParagraphSmall>
                </Block>
              ) : familyMembers.length === 0 ? (
                <ParagraphSmall color="contentSecondary">No family members found.</ParagraphSmall>
              ) : (
                <Block>
                  {familyMembers.map(member => (
                    <Card
                      key={member.id}
                      overrides={{
                        Root: {
                          style: {
                            marginBottom: '12px',
                            backgroundColor: member.roleInFamily === 'OWNER' ? '#E8F5E8' : '#F5F5F5',
                          },
                        },
                      }}
                    >
                      <StyledBody>
                        <Block
                          display="flex" justifyContent="space-between"
                          alignItems="center">
                          <Block>
                            <LabelMedium marginBottom="scale200">
                              {member.firstName}
                              {' '}
                              {member.lastName}
                              {member.roleInFamily === 'OWNER' && ' 👑'}
                            </LabelMedium>
                            <ParagraphSmall marginBottom="scale100" color="contentSecondary">
                              {member.email}
                            </ParagraphSmall>
                            <ParagraphSmall color="contentSecondary">
                              Role:
                              {' '}
                              {member.roleInFamily}
                              {' '}
                              • Member since:
                              {' '}
                              {new Date(member.createdAt).toLocaleDateString()}
                            </ParagraphSmall>
                          </Block>

                          {/* Can't remove owner */}
                          {member.roleInFamily !== 'OWNER' && (
                            <Block>
                              {memberToRemove === member.id ? (
                                <Block
                                  display="flex" flexDirection="column"
                                  gridGap="scale200">
                                  <ParagraphSmall color="negative">Confirm removal?</ParagraphSmall>
                                  <Block display="flex" gridGap="scale200">
                                    <Button
                                      size={SIZE.mini}
                                      kind={KIND.primary}
                                      onClick={() => handleRemoveMember(member.id)}
                                      overrides={{
                                        Root: {
                                          style: {
                                            backgroundColor: '#f44336',
                                            borderColor: '#f44336',
                                          },
                                        },
                                      }}
                                    >
                                      Yes, Remove
                                    </Button>
                                    <Button
                                      size={SIZE.mini}
                                      kind={KIND.secondary}
                                      onClick={() => setMemberToRemove(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </Block>
                                </Block>
                              ) : (
                                <Button
                                  size={SIZE.mini}
                                  kind={KIND.tertiary}
                                  onClick={() => handleRemoveMember(member.id)}
                                  overrides={{
                                    Root: {
                                      style: {
                                        color: '#f44336',
                                        borderColor: '#f44336',
                                      },
                                    },
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </Block>
                          )}
                        </Block>
                      </StyledBody>
                    </Card>
                  ))}
                </Block>
              )}
            </Block>

            {/* Join Requests Section */}
            <Block>
              <LabelMedium marginBottom="scale600">
                Incoming Join Requests (
                {incomingRequests.length}
                )
              </LabelMedium>

              {requestsLoading ? (
                <Block
                  display="flex" alignItems="center"
                  justifyContent="center" padding="scale400">
                  <Spinner size={SPINNER_SIZE.small} />
                  <ParagraphSmall marginLeft="scale300">Loading requests...</ParagraphSmall>
                </Block>
              ) : incomingRequests.length === 0 ? (
                <ParagraphSmall color="contentSecondary">No pending join requests at this time.</ParagraphSmall>
              ) : (
                <Block>
                  {incomingRequests.map(request => (
                    <Card
                      key={request.id}
                      overrides={{ Root: { style: { marginBottom: '16px' } } }}
                    >
                      <StyledBody>
                        <Block marginBottom="scale400">
                          <LabelMedium marginBottom="scale200">
                            Request from
                            {' '}
                            {request.user.firstName}
                            {' '}
                            {request.user.lastName}
                          </LabelMedium>
                          <ParagraphSmall marginBottom="scale200">
                            <strong>Email:</strong>
                            {' '}
                            {request.user.email}
                          </ParagraphSmall>
                          <ParagraphSmall marginBottom="scale200">
                            <strong>Requested:</strong>
                            {' '}
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </ParagraphSmall>
                          {request.message && (
                            <ParagraphSmall marginBottom="scale200">
                              <strong>Message:</strong>
                              {' '}
                              {request.message}
                            </ParagraphSmall>
                          )}
                        </Block>

                        <Textarea
                          value={responseMessages[request.id] || ''}
                          onChange={e => handleMessageChange(request.id, e.target.value)}
                          placeholder="Add a response message (optional)..."
                          overrides={{
                            Root: { style: { marginBottom: '12px' } },
                          }}
                        />

                        <Block display="flex" gridGap="scale300">
                          <Button
                            size={SIZE.mini}
                            kind={KIND.primary}
                            onClick={() => handleJoinRequestResponse(request.id, 'APPROVE')}
                          >
                            ✅ Approve
                          </Button>

                          <Button
                            size={SIZE.mini}
                            kind={KIND.secondary}
                            onClick={() => handleJoinRequestResponse(request.id, 'REJECT')}
                          >
                            ❌ Reject
                          </Button>
                        </Block>
                      </StyledBody>
                    </Card>
                  ))}
                </Block>
              )}
            </Block>
          </Block>
        )}

        {activeTab === 'family' && (
          <Block>
            <LabelMedium marginBottom="scale600">Family Information</LabelMedium>
            {user?.familyId ? (
              <Block>
                <Block marginBottom="scale400">
                  <ParagraphSmall>
                    <strong>Role:</strong>
                    {' '}
                    {user?.roleInFamily}
                  </ParagraphSmall>
                </Block>
                <Block marginBottom="scale400">
                  <ParagraphSmall>
                    <strong>Member Since:</strong>
                    {' '}
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </ParagraphSmall>
                </Block>
              </Block>
            ) : (
              <Block>
                <ParagraphSmall marginBottom="scale600">
                  You are not a member of any family yet.
                </ParagraphSmall>
                <Button
                  onClick={() => {
                    navigate('/family-setup');
                    onClose();
                  }}
                  overrides={{ Root: { style: { width: '100%' } } }}
                >
                  Join or Create Family
                </Button>
              </Block>
            )}
          </Block>
        )}
      </Block>

      {/* Footer - Logout */}
      <Block
        padding="scale600"
        borderTop="1px solid"
        borderColor="borderOpaque"
      >
        <Button
          onClick={handleLogout}
          size={SIZE.compact}
          kind="secondary"
          overrides={{
            Root: {
              style: {
                width: '100%',
                backgroundColor: '#f44336',
                color: 'white',
              },
            },
          }}
        >
          🚪 Logout
        </Button>
      </Block>
    </Drawer>
  );
};

export default UserProfile;
