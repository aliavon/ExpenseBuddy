import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Button, SIZE } from 'baseui/button';
import { HeadingXLarge, ParagraphMedium } from 'baseui/typography';
import { toaster } from 'baseui/toast';

import { REQUEST_PASSWORD_RESET } from '../../gql/auth';

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
});

const RequestPasswordResetPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [requestPasswordReset] = useMutation(REQUEST_PASSWORD_RESET, {
    onCompleted: () => {
      toaster.positive('Password reset instructions sent! Check your email.');
      // Redirect back to login after success
      setTimeout(() => navigate('/auth/login'), 2000);
    },
    onError: error => {
      console.error('Request password reset error:', error);
      toaster.negative('Failed to send reset instructions. Try again later.');
    },
  });

  const handleSubmit = async (values, { setSubmitting, _setFieldError }) => {
    try {
      setIsLoading(true);
      await requestPasswordReset({
        variables: { email: values.email },
      });
    } catch (error) {
      console.error('Request failed:', error);
      // Error handling is done in onError callback
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Block
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      backgroundColor="rgb(248, 249, 250)"
      padding="scale600"
    >
      <Block
        backgroundColor="white"
        padding="scale1000"
        overrides={{
          Block: {
            style: {
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '400px',
            },
          },
        }}
      >
        <Block marginBottom="scale800">
          <HeadingXLarge marginBottom="scale400">
            Reset Password
          </HeadingXLarge>
          <ParagraphMedium color="contentSecondary">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </ParagraphMedium>
        </Block>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <form onSubmit={handleSubmit}>
              <Block marginBottom="scale600">
                <FormControl
                  label="Email Address"
                  error={touched.email && errors.email ? errors.email : null}
                >
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && !!errors.email}
                  />
                </FormControl>
              </Block>

              <Block marginBottom="scale600">
                <Button
                  type="submit"
                  size={SIZE.large}
                  disabled={isSubmitting || isLoading}
                  overrides={{
                    BaseButton: {
                      style: {
                        width: '100%',
                      },
                    },
                  }}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </Block>

              <Block textAlign="center">
                <ParagraphMedium>
                  Remember your password?
                  {' '}
                  <Link to="/auth/login" style={{ color: '#0070f3', textDecoration: 'none' }}>
                    Back to Sign In
                  </Link>
                </ParagraphMedium>
              </Block>
            </form>
          )}
        </Formik>
      </Block>
    </Block>
  );
};

export default RequestPasswordResetPage;
