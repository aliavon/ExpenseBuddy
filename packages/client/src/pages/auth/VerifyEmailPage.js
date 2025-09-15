import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { Button, SIZE } from 'baseui/button';
import { HeadingXLarge, ParagraphMedium } from 'baseui/typography';
import { toaster } from 'baseui/toast';
import { Spinner } from 'baseui/spinner';

import { VERIFY_EMAIL_MUTATION } from '../../gql/auth';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying | success | error

  const token = searchParams.get('token');

  const [verifyEmail] = useMutation(VERIFY_EMAIL_MUTATION, {
    onCompleted: data => {
      if (data.verifyEmail) {
        setVerificationStatus('success');
        toaster.positive('Email verified successfully! You can now log in.');
      } else {
        setVerificationStatus('error');
        toaster.negative('Email verification failed. Please try again.');
      }
    },
    onError: error => {
      console.error('Email verification error:', error);
      setVerificationStatus('error');

      if (error.message.includes('Invalid or expired')) {
        toaster.negative('Verification link is invalid or expired. Please request a new verification email.');
      } else {
        toaster.negative('Email verification failed. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      toaster.negative('Invalid verification link. Missing token.');
      return;
    }

    // Start verification process
    verifyEmail({
      variables: { token },
    });
  }, [token, verifyEmail]);

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  const renderContent = () => {
    switch (verificationStatus) {
    case 'verifying':
      return (
        <Block textAlign="center">
          <Spinner size={SIZE.medium} />
          <HeadingXLarge marginTop="scale600" marginBottom="scale400">
            Verifying Your Email
          </HeadingXLarge>
          <ParagraphMedium color="contentSecondary">
            Please wait while we verify your email address...
          </ParagraphMedium>
        </Block>
      );

    case 'success':
      return (
        <Block textAlign="center">
          <Block
            marginBottom="scale600"
            fontSize="48px"
            color="positive"
          >
            ✅
          </Block>
          <HeadingXLarge marginBottom="scale400" color="positive">
            Email Verified!
          </HeadingXLarge>
          <ParagraphMedium color="contentSecondary" marginBottom="scale600">
            Your email has been successfully verified. You can now log in to your account.
          </ParagraphMedium>
          <Button
            size={SIZE.large}
            onClick={handleGoToLogin}
            overrides={{ Root: { style: { width: '200px' } } }}
          >
            Go to Login
          </Button>
        </Block>
      );

    case 'error':
      return (
        <Block textAlign="center">
          <Block
            marginBottom="scale600"
            fontSize="48px"
            color="negative"
          >
            ❌
          </Block>
          <HeadingXLarge marginBottom="scale400" color="negative">
            Verification Failed
          </HeadingXLarge>
          <ParagraphMedium color="contentSecondary" marginBottom="scale600">
            The verification link is invalid or expired. Please check your email for a new verification link or contact support.
          </ParagraphMedium>
          <Block>
            <Button
              size={SIZE.large}
              onClick={handleGoToLogin}
              overrides={{ Root: { style: { width: '200px', marginRight: '12px' } } }}
            >
              Go to Login
            </Button>
            <Link to="/auth/register">
              <Button
                kind="secondary"
                size={SIZE.large}
                overrides={{ Root: { style: { width: '200px' } } }}
              >
                Register Again
              </Button>
            </Link>
          </Block>
        </Block>
      );

    default:
      return null;
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
        width="500px"
        maxWidth="90vw"
        backgroundColor="backgroundPrimary"
        borderRadius="scale300"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
        padding="scale800"
      >
        {renderContent()}
      </Block>
    </Block>
  );
};

export default VerifyEmailPage;
