import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { HeadingLarge, ParagraphMedium } from 'baseui/typography';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { toaster } from 'baseui/toast';

import { CONFIRM_EMAIL_CHANGE_MUTATION } from '../../gql/auth';
import { useAuth } from '../../contexts/AuthContext';

const ConfirmEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const [confirmEmailChange] = useMutation(CONFIRM_EMAIL_CHANGE_MUTATION, {
    onCompleted: async () => {
      setStatus('success');
      toaster.positive('Email address changed successfully! Please log in again.');

      // Logout user to clear old authentication with previous email
      try {
        await logout();
      } catch (error) {
        console.warn('Logout error during email change:', error);
        // Continue anyway - user will be redirected to login
      }

      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
    onError: error => {
      console.error('Email change confirmation error:', error);
      setStatus('error');
      setErrorMessage(error.message);
      toaster.negative(`Email change failed: ${error.message}`);
    },
  });

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid email change link - missing token');
      return;
    }

    // Automatically confirm email change
    confirmEmailChange({
      variables: { token },
    });
  }, [searchParams, confirmEmailChange]);

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  return (
    <Block
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      padding="scale800"
    >
      <Block
        backgroundColor="backgroundSecondary"
        padding="scale800"
        borderRadius="scale300"
        maxWidth="500px"
        textAlign="center"
      >
        {status === 'loading' && (
          <>
            <Spinner size="scale1200" />
            <HeadingLarge marginTop="scale600" marginBottom="scale400">
              Confirming Email Change
            </HeadingLarge>
            <ParagraphMedium color="contentSecondary">
              Please wait while we process your email change request...
            </ParagraphMedium>
          </>
        )}

        {status === 'success' && (
          <>
            <Block fontSize="60px" marginBottom="scale600">
              ✅
            </Block>
            <HeadingLarge marginBottom="scale400" color="positive">
              Email Changed Successfully!
            </HeadingLarge>
            <ParagraphMedium marginBottom="scale600" color="contentSecondary">
              Your email address has been successfully updated. For security reasons, you have been logged out and need to sign in again with your new email.
            </ParagraphMedium>
            <Button onClick={handleReturnToLogin}>
              Go to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <Block fontSize="60px" marginBottom="scale600">
              ❌
            </Block>
            <HeadingLarge marginBottom="scale400" color="negative">
              Email Change Failed
            </HeadingLarge>
            <ParagraphMedium marginBottom="scale600" color="contentSecondary">
              {errorMessage || 'An error occurred while processing your email change request.'}
            </ParagraphMedium>
            <Block>
              <Button
                onClick={handleReturnToLogin} kind="secondary"
                size="compact">
                Go to Login
              </Button>
            </Block>
          </>
        )}
      </Block>
    </Block>
  );
};

export default ConfirmEmailChangePage;
