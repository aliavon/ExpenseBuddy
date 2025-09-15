import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Button, SIZE, KIND } from 'baseui/button';
import { Radio, RadioGroup } from 'baseui/radio';
import { HeadingXLarge, HeadingMedium, ParagraphMedium, LabelMedium } from 'baseui/typography';
import { Card, StyledBody } from 'baseui/card';
import { toaster } from 'baseui/toast';
import { Spinner, SIZE as SPINNER_SIZE } from 'baseui/spinner';

import { useAuth } from '../../contexts/AuthContext';
import {
  CREATE_FAMILY_MUTATION,
  SEARCH_FAMILIES_QUERY,
  REQUEST_JOIN_FAMILY_MUTATION,
  MY_JOIN_REQUESTS_QUERY,
} from '../../gql/family';

// Validation schemas
const createFamilySchema = Yup.object({
  familyName: Yup.string()
    .required('Family name is required')
    .min(2, 'Minimum 2 characters'),
  familyDescription: Yup.string(),
});

const findFamilySchema = Yup.object({
  searchTerm: Yup.string()
    .required('Please enter family name to search')
    .min(2, 'Minimum 2 characters'),
});

const FamilySetupPage = () => {
  const navigate = useNavigate();
  const { user, refetchUser } = useAuth();
  const [setupOption, setSetupOption] = useState('create'); // 'create' | 'find'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch user's join requests
  const { data: joinRequestsData, loading: joinRequestsLoading, refetch: refetchJoinRequests } = useQuery(MY_JOIN_REQUESTS_QUERY, {
    fetchPolicy: 'cache-and-network', // Always fetch fresh data
    errorPolicy: 'all', // Don't fail silently
    onError: error => {
      console.error('Failed to fetch join requests:', error);
      // Don't show error to user unless it's critical
    },
  });

  const joinRequests = joinRequestsData?.myJoinRequests || [];

  // TODO: Replace with actual mutations when implemented
  const [createFamily] = useMutation(CREATE_FAMILY_MUTATION, {
    onCompleted: async () => {
      toaster.positive('Family created successfully! Welcome to your new family.');
      await refetchUser(); // Refresh user data to get familyId
      navigate('/add');
    },
    onError: error => {
      console.error('Create family error:', error);
      toaster.negative('Failed to create family. Please try again.');
    },
  });

  const [searchFamilies] = useLazyQuery(SEARCH_FAMILIES_QUERY, {
    onCompleted: data => {
      setSearchResults(data.searchFamilies || []);
      setIsSearching(false);
    },
    onError: error => {
      console.error('Search families error:', error);
      toaster.negative('Failed to search families. Please try again.');
      setIsSearching(false);
    },
  });

  const [requestJoinFamily] = useMutation(REQUEST_JOIN_FAMILY_MUTATION, {
    onCompleted: () => {
      toaster.positive('Join request sent! The family owner will be notified via email.');
      refetchJoinRequests(); // Refresh the join requests list
    },
    onError: error => {
      console.error('Request join family error:', error);
      toaster.negative('Failed to send join request. Please try again.');
    },
  });

  const handleCreateFamily = async (values, { setSubmitting }) => {
    try {
      await createFamily({
        variables: {
          input: {
            name: values.familyName,
            description: values.familyDescription || '',
          },
        },
      });
    } catch (error) {
      console.error('Create family failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchFamilies = async (values, { setSubmitting }) => {
    setIsSearching(true);
    setSearchResults([]);
    setHasSearched(true);

    try {
      await searchFamilies({
        variables: { searchTerm: values.searchTerm },
      });
    } catch (error) {
      console.error('Search failed:', error);
      setIsSearching(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestJoin = async familyId => {
    try {
      await requestJoinFamily({
        variables: { familyId },
      });
    } catch (error) {
      console.error('Join request failed:', error);
    }
  };

  return (
    <Block
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      backgroundColor="primary50"
      padding="scale600"
    >
      <Block
        width="600px"
        maxWidth="90vw"
        backgroundColor="backgroundPrimary"
        borderRadius="scale300"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        padding="scale800"
      >
        {/* Header */}
        <Block textAlign="center" marginBottom="scale800">
          <HeadingXLarge marginBottom="scale400">
            Family Setup
          </HeadingXLarge>
          <ParagraphMedium color="contentSecondary">
            Welcome
            {' '}
            {user?.firstName}
            ! To get started, you need to either create a new family or join an existing one.
          </ParagraphMedium>
        </Block>

        {/* Show user's join requests if any */}
        {joinRequests.length > 0 && (
          <Block marginBottom="scale800">
            <LabelMedium marginBottom="scale400">Your Family Join Requests:</LabelMedium>
            {joinRequests.map(request => (
              <Card
                key={request.id}
                overrides={{
                  Root: {
                    style: {
                      marginBottom: '12px',
                      backgroundColor:
                        request.status === 'PENDING' ? '#FFF8E1' :
                          request.status === 'APPROVED' ? '#E8F5E8' :
                            request.status === 'REJECTED' ? '#FFEBEE' : '#F5F5F5',
                    },
                  },
                }}
              >
                <StyledBody>
                  <Block
                    display="flex" justifyContent="space-between"
                    alignItems="flex-start">
                    <Block>
                      <LabelMedium marginBottom="scale200">{request.family.name}</LabelMedium>
                      <ParagraphMedium marginBottom="scale200">
                        {request.family.description || 'No description provided'}
                      </ParagraphMedium>
                      <ParagraphMedium marginBottom="scale200">
                        Owner:
                        {' '}
                        {request.owner.firstName}
                        {' '}
                        {request.owner.lastName}
                      </ParagraphMedium>
                      <ParagraphMedium>
                        Requested:
                        {' '}
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </ParagraphMedium>
                    </Block>
                    <Block>
                      <Block
                        padding="scale200"
                        backgroundColor={
                          request.status === 'PENDING' ? 'warning50' :
                            request.status === 'APPROVED' ? 'positive50' :
                              request.status === 'REJECTED' ? 'negative50' : 'backgroundSecondary'
                        }
                        borderRadius="scale100"
                      >
                        <LabelMedium>
                          {request.status === 'PENDING' && '⏳ Pending'}
                          {request.status === 'APPROVED' && '✅ Approved'}
                          {request.status === 'REJECTED' && '❌ Rejected'}
                          {request.status === 'CANCELLED' && '🚫 Cancelled'}
                        </LabelMedium>
                      </Block>
                    </Block>
                  </Block>
                  {request.responseMessage && (
                    <Block marginTop="scale400">
                      <LabelMedium>Response:</LabelMedium>
                      <ParagraphMedium>{request.responseMessage}</ParagraphMedium>
                    </Block>
                  )}
                </StyledBody>
              </Card>
            ))}
          </Block>
        )}

        {joinRequestsLoading && (
          <Block marginBottom="scale600" textAlign="center">
            <Spinner size={SPINNER_SIZE.large} />
            <ParagraphMedium marginTop="scale400">Loading your requests...</ParagraphMedium>
          </Block>
        )}

        {/* Setup Option Selection */}
        <Block marginBottom="scale800">
          <LabelMedium marginBottom="scale400">Choose an option:</LabelMedium>
          <RadioGroup
            value={setupOption}
            onChange={e => {
              setSetupOption(e.target.value);
              setSearchResults([]); // Clear search results when switching
              setHasSearched(false); // Reset search state
            }}
          >
            <Radio value="create">
              Create a New Family
            </Radio>
            <Radio value="find">
              Find and Join an Existing Family
            </Radio>
          </RadioGroup>
        </Block>

        {/* Create Family Form */}
        {setupOption === 'create' && (
          <Block>
            <HeadingMedium marginBottom="scale600">Create Your Family</HeadingMedium>
            <Formik
              initialValues={{
                familyName: '',
                familyDescription: '',
              }}
              validationSchema={createFamilySchema}
              onSubmit={handleCreateFamily}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit}>
                  <FormControl
                    label="Family Name *"
                    error={touched.familyName && errors.familyName ? errors.familyName : null}
                  >
                    <Input
                      name="familyName"
                      placeholder="Enter your family name (e.g., Smith Family)"
                      value={values.familyName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.familyName && !!errors.familyName}
                      disabled={isSubmitting}
                    />
                  </FormControl>

                  <FormControl
                    label="Family Description (Optional)"
                    error={touched.familyDescription && errors.familyDescription ? errors.familyDescription : null}
                  >
                    <Input
                      name="familyDescription"
                      placeholder="Brief description of your family"
                      value={values.familyDescription}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.familyDescription && !!errors.familyDescription}
                      disabled={isSubmitting}
                    />
                  </FormControl>

                  <Block marginTop="scale600">
                    <Button
                      type="submit"
                      size={SIZE.large}
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                      overrides={{ Root: { style: { width: '100%' } } }}
                    >
                      Create Family
                    </Button>
                  </Block>
                </form>
              )}
            </Formik>
          </Block>
        )}

        {/* Find Family Form */}
        {setupOption === 'find' && (
          <Block>
            <HeadingMedium marginBottom="scale600">Find an Existing Family</HeadingMedium>

            <Formik
              initialValues={{ searchTerm: '' }}
              validationSchema={findFamilySchema}
              onSubmit={handleSearchFamilies}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit}>
                  <FormControl
                    label="Search for Family"
                    error={touched.searchTerm && errors.searchTerm ? errors.searchTerm : null}
                  >
                    <Input
                      name="searchTerm"
                      placeholder="Enter family name to search"
                      value={values.searchTerm}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.searchTerm && !!errors.searchTerm}
                      disabled={isSubmitting || isSearching}
                    />
                  </FormControl>

                  <Block marginTop="scale400" marginBottom="scale600">
                    <Button
                      type="submit"
                      size={SIZE.large}
                      isLoading={isSubmitting || isSearching}
                      disabled={isSubmitting || isSearching}
                      overrides={{ Root: { style: { width: '100%' } } }}
                    >
                      Search Families
                    </Button>
                  </Block>
                </form>
              )}
            </Formik>

            {/* Search Results */}
            {isSearching && (
              <Block textAlign="center" paddingTop="scale600">
                <Spinner size={SIZE.medium} />
                <ParagraphMedium marginTop="scale400">Searching families...</ParagraphMedium>
              </Block>
            )}

            {searchResults.length > 0 && (
              <Block>
                <LabelMedium marginBottom="scale400">Search Results:</LabelMedium>
                {searchResults.map(family => (
                  <Card key={family.id} overrides={{ Root: { style: { marginBottom: '16px' } } }}>
                    <StyledBody>
                      <Block
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Block>
                          <HeadingMedium marginBottom="scale200">{family.name}</HeadingMedium>
                          {family.description && (
                            <ParagraphMedium marginBottom="scale200">{family.description}</ParagraphMedium>
                          )}
                          <ParagraphMedium color="contentSecondary">
                            Owner:
                            {' '}
                            {family.owner.firstName}
                            {' '}
                            {family.owner.lastName}
                            {' '}
                            •
                            {' '}
                            {family.memberCount}
                            {' '}
                            members
                          </ParagraphMedium>
                        </Block>
                        <Button
                          kind={KIND.primary}
                          size={SIZE.compact}
                          onClick={() => handleRequestJoin(family.id)}
                        >
                          Request to Join
                        </Button>
                      </Block>
                    </StyledBody>
                  </Card>
                ))}
              </Block>
            )}

            {!isSearching && searchResults.length === 0 && hasSearched && (
              <Block textAlign="center" paddingTop="scale600">
                <ParagraphMedium color="contentSecondary">
                  No families found with that name. Try a different search term.
                </ParagraphMedium>
              </Block>
            )}
          </Block>
        )}
      </Block>
    </Block>
  );
};

export default FamilySetupPage;
