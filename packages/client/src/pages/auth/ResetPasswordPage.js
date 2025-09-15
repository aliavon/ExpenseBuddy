import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Button, SIZE } from 'baseui/button';
import { HeadingXLarge, ParagraphMedium } from 'baseui/typography';
import { toaster } from 'baseui/toast';

import { RESET_PASSWORD } from '../../gql/auth';

// Validation schema
const validationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toaster.negative('Invalid or missing reset token');
      navigate('/auth/login');
    }
  }, [token, navigate]);

  const [resetPassword] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      toaster.positive('Password reset successful! You can now sign in with your new password.');
      // Redirect to login after success
      setTimeout(() => navigate('/auth/login'), 2000);
    },
    onError: error => {
      console.error('Reset password error:', error);
      if (error.message.includes('Invalid or expired')) {
        toaster.negative('Reset link has expired or is invalid. Please request a new one.');
      } else {
        toaster.negative('Failed to reset password. Please try again.');
      }
    },
  });

  const handleSubmit = async (values, { setSubmitting, _setFieldError }) => {
    try {
      setIsLoading(true);
      await resetPassword({
        variables: {
          input: {
            token,
            newPassword: values.newPassword,
          },
        },
      });
    } catch (error) {
      console.error('Reset failed:', error);
      // Error handling is done in onError callback
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

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
            Set New Password
          </HeadingXLarge>
          <ParagraphMedium color="contentSecondary">
            Enter your new password below. Make sure it&apos;s at least 8 characters long.
          </ParagraphMedium>
        </Block>

        <Formik
          initialValues={{ newPassword: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <form onSubmit={handleSubmit}>
              <Block marginBottom="scale600">
                <FormControl
                  label="New Password"
                  error={touched.newPassword && errors.newPassword ? errors.newPassword : null}
                >
                  <Input
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={values.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.newPassword && !!errors.newPassword}
                  />
                </FormControl>
              </Block>

              <Block marginBottom="scale600">
                <FormControl
                  label="Confirm Password"
                  error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : null}
                >
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword && !!errors.confirmPassword}
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
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </Block>

              <Block textAlign="center">
                <ParagraphMedium>
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

export default ResetPasswordPage;
