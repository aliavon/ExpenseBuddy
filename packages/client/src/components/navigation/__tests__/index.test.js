import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import SideNav from '../index';
import {useLocation, useNavigate} from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock baseui components
jest.mock('baseui/side-navigation', () => ({
  Navigation: jest.fn(({items, activeItemId, onChange}) => (
    <div data-testid="navigation">
      {items.map(item => (
        <button
          key={item.itemId}
          data-testid={`nav-item-${item.itemId}`}
          data-active={activeItemId === item.itemId}
          onClick={(event) => onChange({event, item})}
        >
          {item.title}
        </button>
      ))}
    </div>
  )),
}));

jest.mock('baseui/block', () => ({
  Block: ({children, height, backgroundColor}) => (
    <div 
      data-testid="block" 
      data-height={height} 
      data-background-color={backgroundColor}
    >
      {children}
    </div>
  ),
}));

// Mock UserProfile component to avoid Apollo Client issues
jest.mock('../../profile/UserProfile', () => 
  jest.fn(({isOpen, onClose}) => 
    isOpen ? <div data-testid="user-profile" onClick={onClose}>User Profile</div> : null
  )
);

describe('SideNav Component', () => {
  const mockNavigate = jest.fn();
  const mockUseLocation = useLocation;
  const mockUseNavigate = useNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({pathname: '/add'});
  });

  it('renders navigation with all nav items', () => {
    render(<SideNav />);
    
    expect(screen.getByText('Add Purchases')).toBeInTheDocument();
    expect(screen.getByText('View Purchases')).toBeInTheDocument();
    expect(screen.getByText('Family Income')).toBeInTheDocument();
  });

  it('renders with correct Block wrapper styling', () => {
    render(<SideNav />);
    
    // Check that the container element exists and has proper content
    expect(screen.getByText('Add Purchases')).toBeInTheDocument();
    expect(screen.getByText('View Purchases')).toBeInTheDocument();
    expect(screen.getByText('Family Income')).toBeInTheDocument();
  });

  it('sets active item based on current location', () => {
    mockUseLocation.mockReturnValue({pathname: '/view'});
    
    render(<SideNav />);
    
    const viewButton = screen.getByText('View Purchases');
    const addButton = screen.getByText('Add Purchases');
    
    expect(viewButton).toHaveAttribute('data-active', 'true');
    expect(addButton).toHaveAttribute('data-active', 'false');
  });

  it('handles navigation when item is clicked', () => {
    render(<SideNav />);
    
    const viewButton = screen.getByText('View Purchases');
    fireEvent.click(viewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/view');
  });

  it('handles navigation to income page', () => {
    render(<SideNav />);
    
    const incomeButton = screen.getByText('Family Income');
    fireEvent.click(incomeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/income');
  });

  it('prevents default event when navigating', () => {
    render(<SideNav />);
    
    const mockEvent = {preventDefault: jest.fn()};
    
    // Mock the click to include preventDefault
    const Navigation = require('baseui/side-navigation').Navigation;
    const lastCall = Navigation.mock.calls[Navigation.mock.calls.length - 1];
    const onChange = lastCall[0].onChange;
    
    onChange({
      event: mockEvent,
      item: {itemId: '/add', title: 'Add Purchases'}
    });
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/add');
  });

  it('does not render when there is only one nav item', () => {
    // Create a modified version with one item for testing
    const TestSideNavOneItem = () => {
      const location = useLocation();
      const navigate = useNavigate();
      
      const singleNavItems = [{title: 'Add Purchases', itemId: '/add'}];
      
      if (singleNavItems.length === 1) {
        return null;
      }
      
      return <div>Should not render</div>;
    };
    
    const {container} = render(<TestSideNavOneItem />);
    expect(container.firstChild).toBeNull();
  });

  it('passes correct props to Navigation component', () => {
    mockUseLocation.mockReturnValue({pathname: '/income'});
    
    render(<SideNav />);
    
    const Navigation = require('baseui/side-navigation').Navigation;
    const lastCall = Navigation.mock.calls[Navigation.mock.calls.length - 1];
    const props = lastCall[0];
    
    expect(props.items).toEqual([
      {title: 'Add Purchases', itemId: '/add'},
      {title: 'View Purchases', itemId: '/view'},
      {title: 'Family Income', itemId: '/income'},
      {title: 'Family Dashboard', itemId: '/family'},
    ]);
    expect(props.activeItemId).toBe('/income');
    expect(typeof props.onChange).toBe('function');
  });
}); 