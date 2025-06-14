import React from 'react';
import {render, screen} from '@testing-library/react';
import {Skeleton} from '../skeleton';
import {VIEW} from '../constants';

// Mock baseui skeleton and styletron
jest.mock('baseui/skeleton', () => ({
  Skeleton: jest.fn(({animation, overrides, rows, width, height}) => (
    <div
      testid="base-skeleton"
      data-animation={animation}
      data-rows={rows}
      data-width={width}
      data-height={height}
      data-root-override={!!overrides?.Root}
      data-row-override={!!overrides?.Row}
    >
      Skeleton Component
    </div>
  )),
}));

jest.mock('baseui', () => ({
  useStyletron: jest.fn(() => [
    null,
    {
      sizing: {
        scale0: '0px',
        scale200: '8px',
        scale400: '16px',
        scale600: '24px',
        scale800: '32px',
        scale1000: '40px',
      },
    },
  ]),
}));

// Mock lodash startCase
jest.mock('lodash', () => ({
  startCase: jest.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)),
}));

describe('Skeleton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default Rendering', () => {
    it('renders with default props', () => {
      render(<Skeleton />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-animation', 'true');
    });

    it('uses default view as column', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton />);
      
      expect(MockSkeleton).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: true,
          overrides: expect.objectContaining({
            Root: expect.any(Object),
            Row: expect.any(Object),
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('View Types', () => {
    it('renders with column view', () => {
      render(<Skeleton view={VIEW.column} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with row view', () => {
      render(<Skeleton view={VIEW.row} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders with grid view', () => {
      render(<Skeleton view={VIEW.grid} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes gap prop correctly', () => {
      render(<Skeleton gap="scale400" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('passes radius prop correctly', () => {
      render(<Skeleton radius="scale600" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('passes itemHeight prop correctly', () => {
      render(<Skeleton itemHeight="scale800" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('passes itemWidth prop correctly', () => {
      render(<Skeleton itemWidth="scale1000" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('passes items prop correctly', () => {
      render(<Skeleton items={5} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-rows', '5');
    });

    it('passes width prop correctly', () => {
      render(<Skeleton width="scale600" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-width', '24px');
    });

    it('passes height prop correctly', () => {
      render(<Skeleton height="scale800" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-height', '32px');
    });
  });

  describe('Scale Mapping', () => {
    it('maps scale values to sizing correctly', () => {
      render(<Skeleton width="scale200" height="scale400" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-width', '8px');
      expect(skeleton).toHaveAttribute('data-height', '16px');
    });

    it('passes non-scale values as-is', () => {
      render(<Skeleton width="100px" height="50px" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-width', '100px');
      expect(skeleton).toHaveAttribute('data-height', '50px');
    });

    it('handles undefined scale values', () => {
      render(<Skeleton width="nonexistent" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-width', 'nonexistent');
    });
  });

  describe('Override Functions', () => {
    it('provides Root style override', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton />);
      
      expect(MockSkeleton).toHaveBeenCalledWith(
        expect.objectContaining({
          overrides: expect.objectContaining({
            Root: expect.objectContaining({
              style: expect.any(Function),
            }),
          }),
        }),
        expect.anything()
      );
    });

    it('provides Row style override', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton />);
      
      expect(MockSkeleton).toHaveBeenCalledWith(
        expect.objectContaining({
          overrides: expect.objectContaining({
            Row: expect.objectContaining({
              style: expect.any(Function),
            }),
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('Complex Combinations', () => {
    it('handles grid view with itemWidth', () => {
      render(<Skeleton view={VIEW.grid} itemWidth="scale400" items={6} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-rows', '6');
    });

    it('handles all props together', () => {
      render(
        <Skeleton
          view={VIEW.row}
          gap="scale200"
          radius="scale400"
          itemHeight="scale600"
          itemWidth="scale800"
          items={3}
          width="scale1000"
          height="scale800"
        />
      );
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-rows', '3');
      expect(skeleton).toHaveAttribute('data-width', '40px');
      expect(skeleton).toHaveAttribute('data-height', '32px');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero items', () => {
      render(<Skeleton items={0} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-rows', '0');
    });

    it('handles negative items', () => {
      render(<Skeleton items={-1} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-rows', '-1');
    });

    it('handles empty string values', () => {
      render(<Skeleton width="" height="" />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-width', '');
      expect(skeleton).toHaveAttribute('data-height', '');
    });

    it('handles null/undefined values', () => {
      render(<Skeleton width={null} height={undefined} />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).not.toHaveAttribute('data-width');
      expect(skeleton).not.toHaveAttribute('data-height');
    });
  });

  describe('Animation', () => {
    it('enables animation by default', () => {
      render(<Skeleton />);
      
      const skeleton = screen.getByTestId('base-skeleton');
      expect(skeleton).toHaveAttribute('data-animation', 'true');
    });
  });

  describe('Style Override Function Execution', () => {
    it('executes rootStyleOverride with grid view and itemWidth', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton view={VIEW.grid} itemWidth="scale400" gap="scale200" />);
      
      const calls = MockSkeleton.mock.calls;
      const overrides = calls[calls.length - 1][0].overrides;
      
      // Execute the Root style override function to test the grid view logic
      const rootOverride = overrides.Root.style({
        $theme: {
          sizing: {
            scale200: '8px',
            scale400: '16px',
          },
        },
      });
      
      expect(rootOverride.display).toBe('grid');
      expect(rootOverride.gridRowGap).toBe('8px');
      expect(rootOverride.gridColumnGap).toBe('8px');
      expect(rootOverride.gridTemplateColumns).toContain('16px');
    });

    it('executes rootStyleOverride with column view and no items', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton view={VIEW.column} gap="scale400" radius="scale200" />);
      
      const calls = MockSkeleton.mock.calls;
      const overrides = calls[calls.length - 1][0].overrides;
      
      // Execute the Root style override function to test the column view logic
      const rootOverride = overrides.Root.style({
        $theme: {
          sizing: {
            scale200: '8px',
            scale400: '16px',
          },
        },
      });
      
      expect(rootOverride.flexDirection).toBe('column');
      expect(rootOverride.gridRowGap).toBe('16px');
      expect(rootOverride.borderRadius).toBe('8px');
    });

    it('executes rootStyleOverride with row view', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton view={VIEW.row} gap="scale600" />);
      
      const calls = MockSkeleton.mock.calls;
      const overrides = calls[calls.length - 1][0].overrides;
      
      // Execute the Root style override function to test the row view logic
      const rootOverride = overrides.Root.style({
        $theme: {
          sizing: {
            scale600: '24px',
          },
        },
      });
      
      expect(rootOverride.flexDirection).toBe('row');
      expect(rootOverride.gridColumnGap).toBe('24px');
    });

    it('executes rowStyleOverride with all props', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(
        <Skeleton
          itemHeight="scale800"
          itemWidth="scale1000"
          radius="scale400"
          view={VIEW.column}
        />
      );
      
      const calls = MockSkeleton.mock.calls;
      const overrides = calls[calls.length - 1][0].overrides;
      
      // Execute the Row style override function
      const rowOverride = overrides.Row.style({
        $theme: {
          sizing: {
            scale400: '16px',
            scale800: '32px',
            scale1000: '40px',
          },
        },
      });
      
      expect(rowOverride.borderRadius).toBe('16px');
      expect(rowOverride.marginBottom).toBe('0px');
      expect(rowOverride.flexGrow).toBe(1);
      expect(rowOverride.flexShrink).toBe(0);
      expect(rowOverride.height).toBe('32px');
      expect(rowOverride.width).toBe('40px');
    });

    it('executes rowStyleOverride with grid view (skips width setting)', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(
        <Skeleton
          view={VIEW.grid}
          itemWidth="scale600"
          itemHeight="scale400"
          radius="scale200"
        />
      );
      
      const calls = MockSkeleton.mock.calls;
      const overrides = calls[calls.length - 1][0].overrides;
      
      // Execute the Row style override function with grid view
      const rowOverride = overrides.Row.style({
        $theme: {
          sizing: {
            scale200: '8px',
            scale400: '16px',
            scale600: '24px',
          },
        },
      });
      
      expect(rowOverride.height).toBe('16px');
      expect(rowOverride.borderRadius).toBe('8px');
      // With grid view, width should not be set in row override
      expect(rowOverride.width).toBeUndefined();
    });

    it('executes rootStyleOverride with items present', () => {
      const {Skeleton: MockSkeleton} = require('baseui/skeleton');
      render(<Skeleton items={3} gap="scale200" />);
      
      const calls = MockSkeleton.mock.calls;
      const overrides = calls[calls.length - 1][0].overrides;
      
      // Execute the Root style override function with items
      const rootOverride = overrides.Root.style({
        $theme: {
          sizing: {
            scale200: '8px',
          },
        },
      });
      
      // When items are present, borderRadius should not be set in root
      expect(rootOverride.borderRadius).toBeUndefined();
    });
  });
}); 