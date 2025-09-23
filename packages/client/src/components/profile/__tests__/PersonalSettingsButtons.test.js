import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PersonalSettingsButtons from '../PersonalSettingsButtons';

describe('PersonalSettingsButtons', () => {
  const defaultProps = {
    onEditProfileClick: jest.fn(),
    onChangePasswordClick: jest.fn(),
    onChangeEmailClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all buttons correctly', () => {
    render(<PersonalSettingsButtons {...defaultProps} />);

    expect(screen.getByText('Personal Settings')).toBeInTheDocument();
    expect(screen.getByText('✏️ Edit Personal Information')).toBeInTheDocument();
    expect(screen.getByText('🔒 Change Password')).toBeInTheDocument();
    expect(screen.getByText('📧 Change Email Address')).toBeInTheDocument();
  });

  it('calls onEditProfileClick when edit profile button is clicked', () => {
    const mockOnEditProfileClick = jest.fn();
    
    render(
      <PersonalSettingsButtons 
        {...defaultProps} 
        onEditProfileClick={mockOnEditProfileClick} 
      />
    );

    const editButton = screen.getByText('✏️ Edit Personal Information');
    fireEvent.click(editButton);

    expect(mockOnEditProfileClick).toHaveBeenCalledTimes(1);
  });

  it('calls onChangePasswordClick when change password button is clicked', () => {
    const mockOnChangePasswordClick = jest.fn();
    
    render(
      <PersonalSettingsButtons 
        {...defaultProps} 
        onChangePasswordClick={mockOnChangePasswordClick} 
      />
    );

    const passwordButton = screen.getByText('🔒 Change Password');
    fireEvent.click(passwordButton);

    expect(mockOnChangePasswordClick).toHaveBeenCalledTimes(1);
  });

  it('calls onChangeEmailClick when change email button is clicked', () => {
    const mockOnChangeEmailClick = jest.fn();
    
    render(
      <PersonalSettingsButtons 
        {...defaultProps} 
        onChangeEmailClick={mockOnChangeEmailClick} 
      />
    );

    const emailButton = screen.getByText('📧 Change Email Address');
    fireEvent.click(emailButton);

    expect(mockOnChangeEmailClick).toHaveBeenCalledTimes(1);
  });

  it('renders section title', () => {
    render(<PersonalSettingsButtons {...defaultProps} />);

    expect(screen.getByText('Personal Settings')).toBeInTheDocument();
  });

  it('calls only the specific handler when button is clicked', () => {
    const mockOnEditProfileClick = jest.fn();
    const mockOnChangePasswordClick = jest.fn();
    const mockOnChangeEmailClick = jest.fn();
    
    render(
      <PersonalSettingsButtons 
        onEditProfileClick={mockOnEditProfileClick}
        onChangePasswordClick={mockOnChangePasswordClick}
        onChangeEmailClick={mockOnChangeEmailClick}
      />
    );

    // Click edit profile button
    const editButton = screen.getByText('✏️ Edit Personal Information');
    fireEvent.click(editButton);

    expect(mockOnEditProfileClick).toHaveBeenCalledTimes(1);
    expect(mockOnChangePasswordClick).not.toHaveBeenCalled();
    expect(mockOnChangeEmailClick).not.toHaveBeenCalled();
  });

  it('handles multiple clicks correctly', () => {
    const mockOnEditProfileClick = jest.fn();
    
    render(
      <PersonalSettingsButtons 
        {...defaultProps} 
        onEditProfileClick={mockOnEditProfileClick} 
      />
    );

    const editButton = screen.getByText('✏️ Edit Personal Information');
    
    fireEvent.click(editButton);
    fireEvent.click(editButton);
    fireEvent.click(editButton);

    expect(mockOnEditProfileClick).toHaveBeenCalledTimes(3);
  });

  it('renders all buttons as interactive elements', () => {
    render(<PersonalSettingsButtons {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  it('handles missing handlers gracefully', () => {
    render(
      <PersonalSettingsButtons 
        onEditProfileClick={undefined}
        onChangePasswordClick={undefined}
        onChangeEmailClick={undefined}
      />
    );

    // Should still render buttons
    expect(screen.getByText('✏️ Edit Personal Information')).toBeInTheDocument();
    expect(screen.getByText('🔒 Change Password')).toBeInTheDocument();
    expect(screen.getByText('📧 Change Email Address')).toBeInTheDocument();
  });

  it('does not call handlers if they are undefined', () => {
    render(
      <PersonalSettingsButtons 
        onEditProfileClick={undefined}
        onChangePasswordClick={undefined}
        onChangeEmailClick={undefined}
      />
    );

    const editButton = screen.getByText('✏️ Edit Personal Information');
    
    // Should not crash when clicking
    expect(() => fireEvent.click(editButton)).not.toThrow();
  });

  it('shows correct button text with emojis', () => {
    render(<PersonalSettingsButtons {...defaultProps} />);

    expect(screen.getByText('✏️ Edit Personal Information')).toBeInTheDocument();
    expect(screen.getByText('🔒 Change Password')).toBeInTheDocument();
    expect(screen.getByText('📧 Change Email Address')).toBeInTheDocument();
  });

  it('maintains button order', () => {
    render(<PersonalSettingsButtons {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    
    expect(buttons[0]).toHaveTextContent('✏️ Edit Personal Information');
    expect(buttons[1]).toHaveTextContent('🔒 Change Password');
    expect(buttons[2]).toHaveTextContent('📧 Change Email Address');
  });

  it('calls different handlers independently', () => {
    const mockOnEditProfileClick = jest.fn();
    const mockOnChangePasswordClick = jest.fn();
    const mockOnChangeEmailClick = jest.fn();
    
    render(
      <PersonalSettingsButtons 
        onEditProfileClick={mockOnEditProfileClick}
        onChangePasswordClick={mockOnChangePasswordClick}
        onChangeEmailClick={mockOnChangeEmailClick}
      />
    );

    // Click all buttons
    fireEvent.click(screen.getByText('✏️ Edit Personal Information'));
    fireEvent.click(screen.getByText('🔒 Change Password'));
    fireEvent.click(screen.getByText('📧 Change Email Address'));

    expect(mockOnEditProfileClick).toHaveBeenCalledTimes(1);
    expect(mockOnChangePasswordClick).toHaveBeenCalledTimes(1);
    expect(mockOnChangeEmailClick).toHaveBeenCalledTimes(1);
  });

  it('renders with correct structure', () => {
    render(<PersonalSettingsButtons {...defaultProps} />);

    // Check that title and buttons are properly structured
    const title = screen.getByText('Personal Settings');
    const buttons = screen.getAllByRole('button');
    
    expect(title).toBeInTheDocument();
    expect(buttons).toHaveLength(3);
  });
});
