import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Block } from 'baseui/block';
// Card replaced with styled Block
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Button, SIZE } from 'baseui/button';
import { HeadingXLarge, ParagraphMedium, LabelMedium } from 'baseui/typography';

import { useAuth } from '../../contexts/AuthContext';

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Minimum 6 characters')
    .required('Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);

      // Don't show success toast immediately - wait for full auth completion
      // Success handling moved to AuthContext

      // Redirect to main page
      navigate('/add');
    } catch (error) {
      console.error('Login failed:', error);

      // Error toasts are now handled in AuthContext
      // Only set field errors for form validation
      if (error.message.includes('Invalid credentials') || error.message.includes('User not found')) {
        setFieldError('password', 'Invalid email or password');
      }
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
      height="100vh"
      backgroundColor="primary50"
      padding="scale600"
    >
      <Block
        width="400px"
        maxWidth="90vw"
        backgroundColor="backgroundPrimary"
        borderRadius="scale300"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      >
        <Block padding="scale800">
          {/* Header */}
          <Block
            marginBottom="scale800"
            textAlign="center"
          >
            <HeadingXLarge marginBottom="scale400">
              Sign In
            </HeadingXLarge>
            <ParagraphMedium color="contentSecondary">
              Sign in to access your ExpenseBuddy data
            </ParagraphMedium>
          </Block>

          {/* Form */}
          <Formik
            initialValues={{
              email: '',
              password: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit: formikSubmit,
              isSubmitting,
            }) => (
              <form onSubmit={formikSubmit}>
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
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </FormControl>

                <FormControl
                  label="Password"
                  error={touched.password && errors.password ? errors.password : null}
                >
                  <Input
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && !!errors.password}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </FormControl>

                <Block marginTop="scale600">
                  <Button
                    type="submit"
                    size={SIZE.large}
                    isLoading={isLoading || isSubmitting}
                    disabled={isLoading || isSubmitting}
                    overrides={{ Root: { style: { width: '100%' } } }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Block>

                <Block textAlign="center" marginTop="scale600">
                  <ParagraphMedium>
                    <Link
                      to="/auth/request-reset"
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        fontSize: '14px',
                      }}
                    >
                      Forgot your password?
                    </Link>
                  </ParagraphMedium>
                </Block>
              </form>
            )}
          </Formik>
        </Block>
      </Block>
    </Block>
  );
};

export default LoginPage;
