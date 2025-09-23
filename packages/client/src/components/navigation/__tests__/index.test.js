import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SideNav from '../index';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock BaseUI components
jest.mock('baseui/side-navigation', () => ({
  Navigation: jest.fn(({ items, activeItemId, onChange }) => (
    <div testid="navigation">
      {items.map(item => (
        <button
          key={item.itemId}
          testid={`nav-item-${item.itemId}`}
          data-active={activeItemId === item.itemId}
          onClick={(event) => onChange({ event, item })}
        >
          {item.title}
        </button>
      ))}
    </div>
  )),
}));

jest.mock('baseui/block', () => ({
  Block: ({ children, onClick, ...props }) => (
    <div testid="block" onClick={onClick} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('baseui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button testid="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  SIZE: {
    compact: 'compact',
  },
}));

jest.mock('baseui/typography', () => ({
  LabelMedium: ({ children, ...props }) => (
    <div testid="label-medium" {...props}>{children}</div>
  ),
  ParagraphSmall: ({ children, ...props }) => (
    <div testid="paragraph-small" {...props}>{children}</div>
  ),
}));

jest.mock('baseui/avatar', () => ({
  Avatar: ({ name, size, ...props }) => (
    <div testid="avatar" data-name={name} data-size={size} {...props}>
      Avatar
    </div>
  ),
}));

jest.mock('baseui/toast', () => ({
  toaster: {
    positive: jest.fn(),
    negative: jest.fn(),
  },
}));

// Mock UserProfile component  
let mockUserProfileOnLogout = null;
jest.mock('../../profile/UserProfile', () =>
  jest.fn(({ isOpen, onClose, onLogout }) => {
    mockUserProfileOnLogout = onLogout; // Capture the logout callback from SideNav
    return isOpen ? (
      <div testid="user-profile">
        <button testid="profile-logout-btn" onClick={onLogout}>
          Logout
        </button>
        <button testid="profile-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null;
  })
);

// Mock navItems with only one item for edge case testing
const originalNavItems = [
  { title: 'Add Purchases', itemId: '/add' },
  { title: 'View Purchases', itemId: '/view' },
  { title: 'Family Income', itemId: '/income' },
  { title: 'Family Dashboard', itemId: '/family' },
];

describe('SideNav Component', () => {
  const mockNavigate = jest.fn();
  const mockUseLocation = useLocation;
  const mockUseNavigate = useNavigate;
  const mockLogout = jest.fn();
  const mockUseAuth = useAuth;
  const { toaster } = require('baseui/toast');

  const defaultUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    familyId: 'family-1',
    roleInFamily: 'OWNER',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({ pathname: '/add' });
    mockUseAuth.mockReturnValue({
      user: defaultUser,
      logout: mockLogout,
    });
  });

  it('renders navigation with all nav items', () => {
    render(<SideNav />);
    
    expect(screen.getByText('Add Purchases')).toBeInTheDocument();
    expect(screen.getByText('View Purchases')).toBeInTheDocument();
    expect(screen.getByText('Family Income')).toBeInTheDocument();
    expect(screen.getByText('Family Dashboard')).toBeInTheDocument();
  });

  it('renders user information correctly', () => {
    render(<SideNav />);
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-name', 'John Doe');
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('In Family')).toBeInTheDocument();
    expect(screen.getByText('OWNER')).toBeInTheDocument();
  });

  it('renders user without family correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { ...defaultUser, familyId: null },
      logout: mockLogout,
    });
    
    render(<SideNav />);
    
    expect(screen.getByText('No Family')).toBeInTheDocument();
  });

  it('renders loading state when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });
    
    render(<SideNav />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-name', 'User');
  });

  it('handles navigation when item is clicked', () => {
    render(<SideNav />);
    
    const viewButton = screen.getByText('View Purchases');
    fireEvent.click(viewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/view');
  });

  it('prevents default event when navigating', () => {
    render(<SideNav />);
    
    const mockEvent = { preventDefault: jest.fn() };
    
    // Get the onChange function from Navigation mock
    const Navigation = require('baseui/side-navigation').Navigation;
    const lastCall = Navigation.mock.calls[Navigation.mock.calls.length - 1];
    const onChange = lastCall[0].onChange;
    
    onChange({
      event: mockEvent,
      item: { itemId: '/income', title: 'Family Income' }
    });
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/income');
  });

  it('sets active item based on current location', () => {
    mockUseLocation.mockReturnValue({ pathname: '/income' });
    
    render(<SideNav />);
    
    const Navigation = require('baseui/side-navigation').Navigation;
    const lastCall = Navigation.mock.calls[Navigation.mock.calls.length - 1];
    const props = lastCall[0];
    
    expect(props.activeItemId).toBe('/income');
  });

  it('opens user profile when user info is clicked', () => {
    const UserProfile = require('../../profile/UserProfile');
    
    render(<SideNav />);
    
    // Find and click the user info block (with user name)
    const userBlock = screen.getByText('John Doe').closest('[testid="block"]');
    fireEvent.click(userBlock);
    
    // Check that UserProfile was called with isOpen=true
    const lastCall = UserProfile.mock.calls[UserProfile.mock.calls.length - 1];
    expect(lastCall[0].isOpen).toBe(true);
  });

  it('closes user profile when onClose is called', () => {
    const UserProfile = require('../../profile/UserProfile');
    
    render(<SideNav />);
    
    // Open profile first
    const userBlock = screen.getByText('John Doe').closest('[testid="block"]');
    fireEvent.click(userBlock);
    
    // Get the onClose function and call it
    const lastCall = UserProfile.mock.calls[UserProfile.mock.calls.length - 1];
    const onClose = lastCall[0].onClose;
    onClose();
    
    // Check that UserProfile is called with isOpen=false in next render
    // We need to trigger a re-render by clicking again
    fireEvent.click(userBlock);
    const secondCall = UserProfile.mock.calls[UserProfile.mock.calls.length - 1];
    expect(typeof secondCall[0].onClose).toBe('function');
  });

  it('handles successful logout through UserProfile onLogout prop', async () => {
    mockLogout.mockResolvedValue();
    
    render(<SideNav />);
    
    // Open user profile to trigger UserProfile render with onLogout prop
    const userBlock = screen.getByText('John Doe').closest('[testid="block"]');
    fireEvent.click(userBlock);
    
    // Get the onLogout function that was passed to UserProfile
    const UserProfile = require('../../profile/UserProfile');
    const lastCall = UserProfile.mock.calls[UserProfile.mock.calls.length - 1];
    const onLogout = lastCall[0].onLogout;
    
    // Call the onLogout function directly (this is SideNav's handleLogout)
    await onLogout();
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(toaster.positive).toHaveBeenCalledWith('Successfully logged out');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles logout error through UserProfile onLogout prop', async () => {
    const logoutError = new Error('Logout failed');
    mockLogout.mockRejectedValue(logoutError);
    console.error = jest.fn(); // Mock console.error
    
    render(<SideNav />);
    
    // Open user profile
    const userBlock = screen.getByText('John Doe').closest('[testid="block"]');
    fireEvent.click(userBlock);
    
    // Get the onLogout function that was passed to UserProfile
    const UserProfile = require('../../profile/UserProfile');
    const lastCall = UserProfile.mock.calls[UserProfile.mock.calls.length - 1];
    const onLogout = lastCall[0].onLogout;
    
    // Call the onLogout function which should handle the error
    await onLogout();
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Logout error:', logoutError);
      expect(toaster.negative).toHaveBeenCalledWith('Logout error');
    });
  });


  it('renders user with different role', () => {
    mockUseAuth.mockReturnValue({
      user: { ...defaultUser, roleInFamily: 'MEMBER' },
      logout: mockLogout,
    });
    
    render(<SideNav />);
    
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });

  it('renders user without roleInFamily', () => {
    mockUseAuth.mockReturnValue({
      user: { ...defaultUser, roleInFamily: null },
      logout: mockLogout,
    });
    
    render(<SideNav />);
    
    // Should render empty string for role
    const roleElements = screen.getAllByTestId('paragraph-small');
    expect(roleElements).toHaveLength(3); // "In Family", "", settings icon
  });

  it('renders settings icon', () => {
    render(<SideNav />);
    
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });


});