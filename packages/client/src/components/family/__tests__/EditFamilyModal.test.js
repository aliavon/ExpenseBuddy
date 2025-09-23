import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditFamilyModal from '../EditFamilyModal';

describe('EditFamilyModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    familyInfo: {
      name: 'Test Family',
      description: 'Test family description',
    },
    onFamilyInfoChange: jest.fn(),
    onSave: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<EditFamilyModal {...defaultProps} />);

    expect(screen.getByText('Edit Family Information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Family')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test family description')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<EditFamilyModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(<EditFamilyModal {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when modal close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(<EditFamilyModal {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when Save button is clicked', () => {
    const mockOnSave = jest.fn();
    
    render(<EditFamilyModal {...defaultProps} onSave={mockOnSave} />);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('calls onFamilyInfoChange when name input changes', () => {
    const mockOnFamilyInfoChange = jest.fn();
    
    render(
      <EditFamilyModal 
        {...defaultProps} 
        onFamilyInfoChange={mockOnFamilyInfoChange} 
      />
    );

    const nameInput = screen.getByDisplayValue('Test Family');
    fireEvent.change(nameInput, { target: { value: 'Updated Family Name' } });

    expect(mockOnFamilyInfoChange).toHaveBeenCalledWith('name', 'Updated Family Name');
  });

  it('calls onFamilyInfoChange when description textarea changes', () => {
    const mockOnFamilyInfoChange = jest.fn();
    
    render(
      <EditFamilyModal 
        {...defaultProps} 
        onFamilyInfoChange={mockOnFamilyInfoChange} 
      />
    );

    const descriptionTextarea = screen.getByDisplayValue('Test family description');
    fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } });

    expect(mockOnFamilyInfoChange).toHaveBeenCalledWith('description', 'Updated description');
  });

  it('disables buttons when loading', () => {
    render(<EditFamilyModal {...defaultProps} loading={true} />);

    const cancelButton = screen.getByText('Cancel');
    const saveButton = screen.getByRole('button', { name: /loading Save Changes/ });
    
    expect(cancelButton).toBeDisabled(); // Cancel button gets disabled during loading
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
  });

  it('shows Save Changes text when not loading', () => {
    render(<EditFamilyModal {...defaultProps} loading={false} />);

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<EditFamilyModal {...defaultProps} loading={true} />);

    const saveButton = screen.getByRole('button', { name: /loading Save Changes/ });
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toHaveAttribute('aria-live', 'polite');
  });

  it('renders input fields with correct placeholders', () => {
    render(
      <EditFamilyModal 
        {...defaultProps} 
        familyInfo={{ name: '', description: '' }} 
      />
    );

    const nameInput = screen.getByPlaceholderText('Enter family name...');
    const descriptionTextarea = screen.getByPlaceholderText('Enter family description...');

    expect(nameInput).toBeInTheDocument();
    expect(descriptionTextarea).toBeInTheDocument();
  });

  it('handles empty family info', () => {
    render(
      <EditFamilyModal 
        {...defaultProps} 
        familyInfo={{ name: '', description: '' }} 
      />
    );

    const nameInput = screen.getByPlaceholderText('Enter family name...');
    const descriptionTextarea = screen.getByPlaceholderText('Enter family description...');

    expect(nameInput.value).toBe('');
    expect(descriptionTextarea.value).toBe('');
  });

  it('handles undefined family info gracefully', () => {
    render(
      <EditFamilyModal 
        {...defaultProps} 
        familyInfo={{}} 
      />
    );

    // Should not crash and should render form
    expect(screen.getByText('Edit Family Information')).toBeInTheDocument();
    // Should have empty inputs
    expect(screen.getByPlaceholderText('Enter family name...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Enter family description...')).toHaveValue('');
  });

  it('allows multiple changes to inputs', () => {
    const mockOnFamilyInfoChange = jest.fn();
    
    render(
      <EditFamilyModal 
        {...defaultProps} 
        onFamilyInfoChange={mockOnFamilyInfoChange} 
      />
    );

    const nameInput = screen.getByDisplayValue('Test Family');
    
    fireEvent.change(nameInput, { target: { value: 'First Change' } });
    fireEvent.change(nameInput, { target: { value: 'Second Change' } });

    expect(mockOnFamilyInfoChange).toHaveBeenCalledTimes(2);
    expect(mockOnFamilyInfoChange).toHaveBeenNthCalledWith(1, 'name', 'First Change');
    expect(mockOnFamilyInfoChange).toHaveBeenNthCalledWith(2, 'name', 'Second Change');
  });

  it('renders with correct modal structure', () => {
    render(<EditFamilyModal {...defaultProps} />);

    expect(screen.getByText('Edit Family Information')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});
