// SEPARATE TEST FILE TO ACHIEVE 100% COVERAGE FOR return null LINE
// This tests the exact condition: if (navItems.length === 1) return null;

import React from 'react';
import { render } from '@testing-library/react';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({ pathname: '/test' })),
  useNavigate: jest.fn(() => jest.fn()),
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', firstName: 'Test', lastName: 'User', familyId: 'family-1' },
    logout: jest.fn(),
  })),
}));

// Mock BaseUI components
jest.mock('baseui/side-navigation', () => ({
  Navigation: () => null,
}));

jest.mock('baseui/block', () => ({
  Block: ({ children }) => children,
}));

jest.mock('baseui/button', () => ({
  Button: () => null,
  SIZE: { compact: 'compact' },
}));

jest.mock('baseui/typography', () => ({
  LabelMedium: () => null,
  ParagraphSmall: () => null,
}));

jest.mock('baseui/avatar', () => ({
  Avatar: () => null,
}));

jest.mock('baseui/toast', () => ({
  toaster: { positive: jest.fn(), negative: jest.fn() },
}));

jest.mock('../../profile/UserProfile', () => () => null);

// CRITICAL: Mock constants with SINGLE navItem
jest.mock('../constants', () => ({
  navItems: [{ title: 'Single Item', itemId: '/single' }]
}));

describe('SideNav with single navItem', () => {
  it('returns null when navItems.length === 1', () => {
    // Import after all mocks are set
    const SideNav = require('../index').default;
    
    const { container } = render(React.createElement(SideNav));
    
    // This covers the EXACT line: if (navItems.length === 1) return null;
    expect(container.firstChild).toBeNull();
  });
});
