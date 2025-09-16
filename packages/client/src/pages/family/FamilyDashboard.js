import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { ParagraphSmall, HeadingLarge } from 'baseui/typography';
import { toaster } from 'baseui/toast';

import { useAuth } from '../../contexts/AuthContext';
import {
  FAMILY_MEMBERS_QUERY,
  REMOVE_FAMILY_MEMBER_MUTATION,
  INCOMING_JOIN_REQUESTS_QUERY,
  RESPOND_TO_JOIN_REQUEST_MUTATION,
  UPDATE_FAMILY_MUTATION,
} from '../../gql/family';

// Import components
import {
  FamilyInfoCard,
  FamilyMembersList,
  JoinRequestsSection,
  EditFamilyModal,
  RemoveMemberModal,
} from '../../components/family';

const FamilyDashboard = () => {
  const { user, refetchUser } = useAuth();
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [responseMessages, setResponseMessages] = useState({});
  const [familyEditMode, setFamilyEditMode] = useState(false);
  const [editedFamilyInfo, setEditedFamilyInfo] = useState({
    name: '',
    description: '',
  });

  const isOwner = user?.roleInFamily === 'OWNER';
  const isAdmin = user?.roleInFamily === 'ADMIN' || isOwner;

  // Note: Family info will be loaded separately in future updates

  // Fetch family members
  const { data: membersData, loading: membersLoading, refetch: refetchMembers } = useQuery(FAMILY_MEMBERS_QUERY, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    onError: error => {
      console.error('Failed to fetch family members:', error);
      toaster.negative('Failed to load family members', {});
    },
  });

  // Fetch incoming join requests (only for owners/admins)
  const { data: requestsData, loading: requestsLoading, refetch: refetchRequests } = useQuery(INCOMING_JOIN_REQUESTS_QUERY, {
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    onError: error => {
      console.error('Failed to fetch incoming join requests:', error);
      toaster.negative('Failed to load join requests', {});
    },
  });

  // Remove family member mutation
  const [removeFamilyMember, { loading: removeLoading }] = useMutation(REMOVE_FAMILY_MEMBER_MUTATION, {
    onCompleted: () => {
      toaster.positive('Member removed successfully', {});
      setMemberToRemove(null);
      refetchMembers();
    },
    onError: error => {
      console.error('Failed to remove member:', error);
      toaster.negative(`Failed to remove member: ${error.message}`, {});
    },
  });

  // Respond to join request mutation
  const [respondToJoinRequest, { loading: respondLoading }] = useMutation(RESPOND_TO_JOIN_REQUEST_MUTATION, {
    onCompleted: () => {
      toaster.positive('Response sent successfully', {});
      refetchRequests();
      setResponseMessages({});
    },
    onError: error => {
      console.error('Failed to respond to join request:', error);
      toaster.negative(`Failed to send response: ${error.message}`, {});
    },
  });

  // Update family mutation
  const [updateFamily, { loading: updateLoading }] = useMutation(UPDATE_FAMILY_MUTATION, {
    onCompleted: () => {
      toaster.positive('Family information updated successfully', {});
      setFamilyEditMode(false);
      refetchUser();
    },
    onError: error => {
      console.error('Failed to update family:', error);
      toaster.negative(`Failed to update family: ${error.message}`, {});
    },
  });

  // Handlers
  const handleRemoveMember = async () => {
    if (!memberToRemove) {
      return;
    }

    try {
      await removeFamilyMember({
        variables: { userId: memberToRemove.id },
      });
    } catch (error) {
      console.error('Remove member error:', error);
    }
  };

  const handleJoinRequestResponse = async (requestId, response) => {
    try {
      await respondToJoinRequest({
        variables: {
          input: {
            requestId,
            response,
            responseMessage: responseMessages[requestId] || '',
          },
        },
      });
    } catch (error) {
      console.error('Join request response error:', error);
    }
  };

  const handleFamilyUpdate = async () => {
    try {
      await updateFamily({
        variables: {
          input: {
            familyId: user.familyId,
            name: editedFamilyInfo.name.trim(),
            description: editedFamilyInfo.description.trim(),
          },
        },
      });
    } catch (error) {
      console.error('Family update error:', error);
    }
  };

  const handleFamilyInfoChange = (field, value) => {
    setEditedFamilyInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResponseMessageChange = (requestId, message) => {
    setResponseMessages(prev => ({
      ...prev,
      [requestId]: message,
    }));
  };

  const members = membersData?.familyMembers || [];
  const requests = requestsData?.incomingJoinRequests || [];

  return (
    <Block
      backgroundColor="#FAFAFA"
      minHeight="100vh"
      padding="scale800"
    >
      <Block maxWidth="1200px" margin="0 auto">
        {/* Header */}
        <Block marginBottom="scale800">
          <HeadingLarge marginBottom="scale400">
            Family Dashboard
          </HeadingLarge>
          <ParagraphSmall color="#666">
            Manage your family and view member information
          </ParagraphSmall>
        </Block>

        {/* Family Information Card */}
        <FamilyInfoCard
          user={user}
          members={members}
          isOwner={isOwner}
          onEditClick={() => setFamilyEditMode(true)}
        />

        {/* Family Members List */}
        <FamilyMembersList
          members={members}
          loading={membersLoading}
          isOwner={isOwner}
          onRemoveMember={setMemberToRemove}
        />

        {/* Join Requests Section (Only for ADMIN/OWNER) */}
        {isAdmin && (
          <JoinRequestsSection
            requests={requests}
            loading={requestsLoading}
            responseMessages={responseMessages}
            onResponseMessageChange={handleResponseMessageChange}
            onHandleRequest={handleJoinRequestResponse}
            respondLoading={respondLoading}
          />
        )}
      </Block>

      {/* Remove Member Confirmation Modal */}
      <RemoveMemberModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        memberToRemove={memberToRemove}
        onConfirm={handleRemoveMember}
        loading={removeLoading}
      />

      {/* Family Edit Modal */}
      <EditFamilyModal
        isOpen={familyEditMode}
        onClose={() => setFamilyEditMode(false)}
        familyInfo={editedFamilyInfo}
        onFamilyInfoChange={handleFamilyInfoChange}
        onSave={handleFamilyUpdate}
        loading={updateLoading}
      />
    </Block>
  );
};

export default FamilyDashboard;
