import React from 'react';
import {render, screen} from '@testing-library/react';
import {Block} from 'baseui/block';
import Currency from '../index';

// Mock baseui Block component
jest.mock('baseui/block', () => ({
  Block: jest.fn(({children, color}) => (
    <div testid="currency-block" data-color={color}>
      {children}
    </div>
  )),
}));

describe('Currency Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders currency value correctly', () => {
      render(<Currency value="USD" />);
      
      expect(screen.getByTestId('currency-block')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('renders with empty value', () => {
      render(<Currency value="" />);
      
      expect(screen.getByTestId('currency-block')).toBeInTheDocument();
      expect(screen.getByTestId('currency-block')).toHaveTextContent('');
    });

    it('renders with undefined value', () => {
      render(<Currency value={undefined} />);
      
      expect(screen.getByTestId('currency-block')).toBeInTheDocument();
    });

    it('renders with null value', () => {
      render(<Currency value={null} />);
      
      expect(screen.getByTestId('currency-block')).toBeInTheDocument();
    });
  });

  describe('Color Mapping', () => {
    it('applies correct color for USD', () => {
      render(<Currency value="USD" />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'positive500',
          children: 'USD'
        }),
        expect.anything()
      );
    });

    it('applies correct color for EUR', () => {
      render(<Currency value="EUR" />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'accent500',
          children: 'EUR'
        }),
        expect.anything()
      );
    });

    it('applies correct color for PLN', () => {
      render(<Currency value="PLN" />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'warning500',
          children: 'PLN'
        }),
        expect.anything()
      );
    });

    it('applies default color for unknown currency', () => {
      render(<Currency value="GBP" />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: 'GBP'
        }),
        expect.anything()
      );
    });

    it('applies default color for empty string', () => {
      render(<Currency value="" />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: ''
        }),
        expect.anything()
      );
    });

    it('applies default color for null/undefined values', () => {
      const {rerender} = render(<Currency value={null} />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: null
        }),
        expect.anything()
      );

      rerender(<Currency value={undefined} />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: undefined
        }),
        expect.anything()
      );
    });
  });

  describe('Component Props', () => {
    it('passes value as children to Block component', () => {
      const testValue = 'TEST_CURRENCY';
      render(<Currency value={testValue} />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          children: testValue
        }),
        expect.anything()
      );
    });

    it('calls Block component with correct props structure', () => {
      render(<Currency value="USD" />);
      
      expect(Block).toHaveBeenCalledTimes(1);
      expect(Block).toHaveBeenCalledWith(
        {
          color: 'positive500',
          children: 'USD'
        },
        expect.anything()
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles numeric values', () => {
      render(<Currency value={123} />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: 123
        }),
        expect.anything()
      );
    });

    it('handles boolean values', () => {
      render(<Currency value={true} />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: true
        }),
        expect.anything()
      );
    });

    it('handles case sensitivity - currency codes should be exact match', () => {
      render(<Currency value="usd" />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: 'usd'
        }),
        expect.anything()
      );
    });

    it('handles whitespace in currency codes', () => {
      render(<Currency value=" USD " />);
      
      expect(Block).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'grey',
          children: ' USD '
        }),
        expect.anything()
      );
    });
  });

  describe('Accessibility', () => {
    it('renders accessible content', () => {
      render(<Currency value="USD" />);
      
      const currencyElement = screen.getByTestId('currency-block');
      expect(currencyElement).toBeInTheDocument();
      expect(currencyElement).toHaveTextContent('USD');
    });
  });
}); 