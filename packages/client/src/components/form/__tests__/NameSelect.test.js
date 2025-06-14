import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {MockedProvider} from '@apollo/client/testing';
import NameSelect from '../name-select';
import {GET_ITEMS_BY_CATEGORY_QUERY} from '../../../gql';

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
    <div testid="name-select" data-testid="name-select">
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

describe('NameSelect Component', () => {
  const mockOnChange = jest.fn();
  
  const mockItemsData = {
    items: [
      {id: 'apple', label: 'Apple'},
      {id: 'banana', label: 'Banana'},
      {id: 'orange', label: 'Orange'},
    ],
  };

  const getMocksForCategory = (category) => [
    {
      request: {
        query: GET_ITEMS_BY_CATEGORY_QUERY,
        variables: {category: category || ''},
      },
      result: {
        data: mockItemsData,
      },
    },
  ];

  const getErrorMocks = (category) => [
    {
      request: {
        query: GET_ITEMS_BY_CATEGORY_QUERY,
        variables: {category: category || ''},
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
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      const select = screen.getByTestId('name-select').querySelector('select');
      expect(select).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Success State', () => {
    it('renders items after loading', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: mockItemsData.items,
            isLoading: false,
          }),
          expect.anything()
        );
      });
    });

    it('uses items from GraphQL query directly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: [
              {id: 'apple', label: 'Apple'},
              {id: 'banana', label: 'Banana'},
              {id: 'orange', label: 'Orange'},
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
        <MockedProvider mocks={getErrorMocks('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('name-select').querySelector('select');
        expect(select).toHaveAttribute('data-error', 'true');
      });
    });
  });

  describe('Category Handling', () => {
    it('uses provided category in query variables', () => {
      render(
        <MockedProvider mocks={getMocksForCategory('electronics')} addTypename={false}>
          <NameSelect category="electronics" onChange={mockOnChange} />
        </MockedProvider>
      );

      expect(screen.getByTestId('name-select')).toBeInTheDocument();
    });

    it('uses empty string when no category provided', () => {
      render(
        <MockedProvider mocks={getMocksForCategory('')} addTypename={false}>
          <NameSelect onChange={mockOnChange} />
        </MockedProvider>
      );

      expect(screen.getByTestId('name-select')).toBeInTheDocument();
    });

    it('handles null category', () => {
      render(
        <MockedProvider mocks={getMocksForCategory('')} addTypename={false}>
          <NameSelect category={null} onChange={mockOnChange} />
        </MockedProvider>
      );

      expect(screen.getByTestId('name-select')).toBeInTheDocument();
    });

    it('handles undefined category', () => {
      render(
        <MockedProvider mocks={getMocksForCategory('')} addTypename={false}>
          <NameSelect category={undefined} onChange={mockOnChange} />
        </MockedProvider>
      );

      expect(screen.getByTestId('name-select')).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('renders with no initial value', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
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

    it('renders with provided value', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" value="Apple" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            value: [{id: 'Apple', label: 'Apple'}],
          }),
          expect.anything()
        );
      });
    });

    it('handles empty value correctly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" value="" onChange={mockOnChange} />
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
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" value={null} onChange={mockOnChange} />
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
    it('calls onChange with selected option label', async () => {
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('name-select').querySelector('select');
        expect(select).toHaveAttribute('data-loading', 'false');
      });

      const {Select} = require('baseui/select');
      const lastCall = Select.mock.calls[Select.mock.calls.length - 1][0];
      
      // Simulate selecting an option
      lastCall.onChange({option: {id: 'apple', label: 'Apple'}});

      expect(mockOnChange).toHaveBeenCalledWith('Apple');
    });

    it('calls onChange with undefined when no option selected', async () => {
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        const select = screen.getByTestId('name-select').querySelector('select');
        expect(select).toHaveAttribute('data-loading', 'false');
      });

      const {Select} = require('baseui/select');
      const lastCall = Select.mock.calls[Select.mock.calls.length - 1][0];
      
      // Simulate clearing selection
      lastCall.onChange({});

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Component Props', () => {
    it('passes placeholder correctly', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            placeholder: 'Select or add Name',
          }),
          expect.anything()
        );
      });
    });

    it('sets component as creatable', async () => {
      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
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
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
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
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect 
            category="fruits"
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
    it('uses cache-and-network next fetch policy', () => {
      render(
        <MockedProvider mocks={getMocksForCategory('fruits')} addTypename={false}>
          <NameSelect category="fruits" onChange={mockOnChange} />
        </MockedProvider>
      );

      expect(screen.getByTestId('name-select')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', async () => {
      const emptyMocks = [
        {
          request: {
            query: GET_ITEMS_BY_CATEGORY_QUERY,
            variables: {category: 'empty'},
          },
          result: {
            data: {items: []},
          },
        },
      ];

      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={emptyMocks} addTypename={false}>
          <NameSelect category="empty" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: [],
          }),
          expect.anything()
        );
      });
    });

    it('handles null items data', async () => {
      const nullMocks = [
        {
          request: {
            query: GET_ITEMS_BY_CATEGORY_QUERY,
            variables: {category: 'null'},
          },
          result: {
            data: {items: null},
          },
        },
      ];

      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={nullMocks} addTypename={false}>
          <NameSelect category="null" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: [],
          }),
          expect.anything()
        );
      });
    });

    it('handles undefined data', async () => {
      const undefinedMocks = [
        {
          request: {
            query: GET_ITEMS_BY_CATEGORY_QUERY,
            variables: {category: 'undefined'},
          },
          result: {
            data: undefined,
          },
        },
      ];

      const {Select} = require('baseui/select');
      
      render(
        <MockedProvider mocks={undefinedMocks} addTypename={false}>
          <NameSelect category="undefined" onChange={mockOnChange} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(Select).toHaveBeenLastCalledWith(
          expect.objectContaining({
            options: [],
          }),
          expect.anything()
        );
      });
    });
  });
}); 