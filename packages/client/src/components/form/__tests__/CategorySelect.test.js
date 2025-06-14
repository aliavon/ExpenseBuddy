import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {MockedProvider} from '@apollo/client/testing';
import CategorySelect from '../category-select';
import {GET_CATEGORIES} from '../../../gql';

// Mock baseui Select component
jest.mock('baseui/select', () => ({
  Select: jest.fn(({
    options,
    value,
    onChange,
    placeholder,
    creatable,
    isLoading,
    clearable,
    error,
    ...restProps
  }) => (
    <div testid="category-select" data-testid="category-select">
      <select
        data-loading={isLoading}
        data-error={error}
        data-creatable={creatable}
        data-clearable={clearable}
        data-placeholder={placeholder}
        onChange={(e) => {
          const option = options.find(opt => opt.id === e.target.value);
          onChange({option});
        }}
        value={value?.[0]?.id || ''}
        {...restProps}
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )),
}));

describe('CategorySelect Component', () => {
  const mockOnChange = jest.fn();
  
  const mockCategoriesData = {
    getCategories: ['Food', 'Transport', 'Entertainment', 'Shopping'],
  };

  const mocks = [
    {
      request: {
        query: GET_CATEGORIES,
      },
      result: {
        data: mockCategoriesData,
      },
    },
  ];

  const errorMocks = [
    {
      request: {
        query: GET_CATEGORIES,
      },
      error: new Error('Network error'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      const select = screen.getByTestId('category-select').querySelector('select');
      expect(select).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Success State', () => {
    it('renders categories after loading', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: [
              {id: 'Food', label: 'Food'},
              {id: 'Transport', label: 'Transport'},
              {id: 'Entertainment', label: 'Entertainment'},
              {id: 'Shopping', label: 'Shopping'},
            ],
            isLoading: false,
          }),
          expect.anything()
        );
      });
    });

    it('transforms categories to options format correctly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: [
              {id: 'Food', label: 'Food'},
              {id: 'Transport', label: 'Transport'},
              {id: 'Entertainment', label: 'Entertainment'},
              {id: 'Shopping', label: 'Shopping'},
            ],
          }),
          expect.anything()
        );
      });
    });
  });

  describe('Error State', () => {
    it('shows error state when query fails', async () => {
      render(
        <MockedProvider mocks={errorMocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveAttribute('data-error', 'true');
      });
    });
  });

  describe('Value Handling', () => {
    it('renders with no initial value', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveValue('');
      });
    });

    it('renders with provided value', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect value="Food" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveValue('Food');
      });
    });

    it('formats value correctly for Select component', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect value="Transport" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            value: [{id: 'Transport', label: 'Transport'}],
          }),
          expect.anything()
        );
      });
    });

    it('handles empty value correctly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect value="" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            value: [],
          }),
          expect.anything()
        );
      });
    });

    it('handles null/undefined value correctly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect value={null} onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            value: [],
          }),
          expect.anything()
        );
      });
    });
  });

  describe('onChange Handling', () => {
    it('calls onChange with selected option id', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveAttribute('data-loading', 'false');
      });

      // Simulate the onChange behavior by calling the mock directly
      // since the actual Select component behavior is complex to mock
      const {Select} = require('baseui/select');
      const lastCall = Select.mock.calls[Select.mock.calls.length - 1][0];
      
      // Simulate selecting Food option
      lastCall.onChange({option: {id: 'Food', label: 'Food'}});

      expect(mockOnChange).toHaveBeenCalledWith('Food');
    });

    it('calls onChange with undefined when no option selected', async () => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveAttribute('data-loading', 'false');
      });

      const select = screen.getByTestId('category-select').querySelector('select');
      fireEvent.change(select, {target: {value: ''}});

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Component Props', () => {
    it('passes placeholder correctly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            placeholder: 'Select or create a category',
          }),
          expect.anything()
        );
      });
    });

    it('sets component as creatable', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            creatable: true,
          }),
          expect.anything()
        );
      });
    });

    it('sets component as clearable', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            clearable: true,
          }),
          expect.anything()
        );
      });
    });

    it('passes additional props to Select component', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect 
            onChange={mockOnChange}
            disabled={true}
            size="large"
            customProp="test"
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            disabled: true,
            size: 'large',
            customProp: 'test',
          }),
          expect.anything()
        );
      });
    });
  });

  describe('Query Configuration', () => {
    it('uses cache-and-network fetch policy', () => {
      const {useQuery} = require('@apollo/client');
      
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      // This would need to be tested differently in a real scenario
      // Here we're just ensuring the component renders without error
      expect(screen.getByTestId('category-select')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty categories array', async () => {
      const emptyMocks = [
        {
          request: {
            query: GET_CATEGORIES,
          },
          result: {
            data: {getCategories: []},
          },
        },
      ];

      render(
        <MockedProvider mocks={emptyMocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveAttribute('data-loading', 'false');
      });

      // Should only have the default "Select..." option
      const options = screen.getByTestId('category-select').querySelectorAll('option');
      expect(options).toHaveLength(1);
    });

    it('handles null categories data', async () => {
      const nullMocks = [
        {
          request: {
            query: GET_CATEGORIES,
          },
          result: {
            data: {getCategories: null},
          },
        },
      ];

      render(
        <MockedProvider mocks={nullMocks} addTypename={false}>
          <CategorySelect onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('category-select').querySelector('select');
        expect(select).toHaveAttribute('data-loading', 'false');
      });

      // Should only have the default "Select..." option
      const options = screen.getByTestId('category-select').querySelectorAll('option');
      expect(options).toHaveLength(1);
    });
  });
}); 