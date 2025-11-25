import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Button, SIZE } from 'baseui/button';
import { HeadingXLarge, ParagraphMedium, LabelMedium } from 'baseui/typography';
import { toaster } from 'baseui/toast';

import { REGISTER_MUTATION } from '../../gql/auth';

// Validation schema
const validationSchema = Yup.object({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'Minimum 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Minimum 2 characters'),
  middleName: Yup.string(),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Minimum 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [registerUser] = useMutation(REGISTER_MUTATION, {
    onCompleted: data => {
      toaster.positive(data.register.message || 'Registration successful! Please check your email (including spam folder) to activate your account.');
      navigate('/auth/login');
    },
    onError: error => {
      console.error('Registration error:', error);

      if (error.message.includes('already exists')) {
        toaster.negative('User with this email already exists. Try logging in instead.');
      } else {
        toaster.negative('Registration failed. Please try again.');
      }
    },
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setIsLoading(true);

      await registerUser({
        variables: {
          input: {
            firstName: values.firstName,
            lastName: values.lastName,
            middleName: values.middleName || '',
            email: values.email,
            password: values.password,
          },
        },
      });
    } catch (error) {
      console.error('Registration failed:', error);

      // Set specific field errors for better UX
      if (error.message.includes('already exists')) {
        setFieldError('email', 'User with this email already exists');
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
      >
        <Block padding="scale800">
          {/* Header */}
          <Block
            marginBottom="scale800"
            textAlign="center"
          >
            <HeadingXLarge marginBottom="scale400">
              Create Account
            </HeadingXLarge>
            <ParagraphMedium color="contentSecondary">
              Join ExpenseBuddy and start managing your expenses
            </ParagraphMedium>
          </Block>

          {/* Form */}
          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              middleName: '',
              email: '',
              password: '',
              confirmPassword: '',
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
                {/* Personal Information */}
                <Block marginBottom="scale600">
                  <LabelMedium marginBottom="scale400">Personal Information</LabelMedium>

                  <FormControl
                    label="First Name"
                    error={touched.firstName && errors.firstName ? errors.firstName : null}
                  >
                    <Input
                      name="firstName"
                      placeholder="Enter your first name"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.firstName && !!errors.firstName}
                      disabled={isLoading}
                      autoComplete="given-name"
                    />
                  </FormControl>

                  <FormControl
                    label="Last Name"
                    error={touched.lastName && errors.lastName ? errors.lastName : null}
                  >
                    <Input
                      name="lastName"
                      placeholder="Enter your last name"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.lastName && !!errors.lastName}
                      disabled={isLoading}
                      autoComplete="family-name"
                    />
                  </FormControl>

                  <FormControl
                    label="Middle Name (Optional)"
                    error={touched.middleName && errors.middleName ? errors.middleName : null}
                  >
                    <Input
                      name="middleName"
                      placeholder="Enter your middle name"
                      value={values.middleName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.middleName && !!errors.middleName}
                      disabled={isLoading}
                      autoComplete="additional-name"
                    />
                  </FormControl>
                </Block>

                {/* Account Information */}
                <Block marginBottom="scale600">
                  <LabelMedium marginBottom="scale400">Account Information</LabelMedium>

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
                      placeholder="Enter your password (min 6 characters)"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.password && !!errors.password}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </FormControl>

                  <FormControl
                    label="Confirm Password"
                    error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : null}
                  >
                    <Input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.confirmPassword && !!errors.confirmPassword}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </FormControl>
                </Block>

                <Block marginTop="scale600">
                  <Button
                    type="submit"
                    size={SIZE.large}
                    isLoading={isLoading || isSubmitting}
                    disabled={isLoading || isSubmitting}
                    overrides={{ Root: { style: { width: '100%' } } }}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Block>

                <Block textAlign="center" marginTop="scale600">
                  <ParagraphMedium>
                    Already have an account?
                    {' '}
                    <Link
                      to="/auth/login"
                      style={{
                        color: '#0070f3',
                        textDecoration: 'none',
                        fontSize: '14px',
                      }}
                    >
                      Sign In
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

export default RegisterPage;
