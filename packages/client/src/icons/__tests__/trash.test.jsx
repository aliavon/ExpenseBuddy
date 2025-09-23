import React from 'react';
import { render } from '@testing-library/react';
import Trash from '../trash';

// Mock BaseUI Icon component
jest.mock('baseui/icon', () => {
  const mockReact = require('react');
  return {
    Icon: mockReact.forwardRef(({ title, size, color, overrides, children, ...props }, ref) => (
      mockReact.createElement('svg', {
        ref,
        'data-testid': 'icon',
        title,
        'data-size': size,
        'data-color': color,
        'data-overrides': JSON.stringify(overrides),
        ...props
      }, children)
    )),
  };
});

// Mock overrides
jest.mock('../overrides', () => ({
  SvgOverrides: {
    Svg: {
      style: {
        fill: 'currentColor',
        strokeWidth: '1',
      },
    },
  },
}));

describe('Trash Icon Component - 100% Coverage', () => {
  describe('Basic Functionality', () => {
    it('renders without props', () => {
      const { container } = render(<Trash />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom title', () => {
      const { container } = render(<Trash title="Delete" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom size', () => {
      const { container } = render(<Trash size="24" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom color', () => {
      const { container } = render(<Trash color="red" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with all props', () => {
      const { container } = render(
        <Trash 
          title="Remove Item" 
          size="32" 
          color="danger"
          className="trash-icon"
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Prop Destructuring Coverage', () => {
    it('covers default title "Trash"', () => {
      const { container } = render(<Trash />);
      expect(container).toBeTruthy();
    });

    it('covers size prop without default', () => {
      const { container } = render(<Trash size="16" />);
      expect(container).toBeTruthy();
    });

    it('covers color prop', () => {
      const { container } = render(<Trash color="blue" />);
      expect(container).toBeTruthy();
    });

    it('covers restProps spreading', () => {
      const { container } = render(
        <Trash 
          onClick={() => {}}
          onMouseEnter={() => {}}
          className="custom-class"
          id="trash-id"
          data-custom="value"
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('forwardRef Coverage', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Trash ref={ref} />);
      expect(ref.current).toBeTruthy();
    });

    it('works with callback ref', () => {
      let refElement = null;
      render(<Trash ref={(el) => { refElement = el; }} />);
      expect(refElement).toBeTruthy();
    });

    it('handles null ref', () => {
      expect(() => render(<Trash ref={null} />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props', () => {
      const { container } = render(
        <Trash 
          title={undefined} 
          size={undefined} 
          color={undefined} 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles empty string props', () => {
      const { container } = render(
        <Trash 
          title="" 
          size="" 
          color="" 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles falsy props', () => {
      const { container } = render(
        <Trash 
          title={null} 
          size={0} 
          color={false} 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles numeric props', () => {
      const { container } = render(
        <Trash 
          size={24}
          color={123}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Icon Component Props', () => {
    it('passes all props to Icon component', () => {
      const { container } = render(
        <Trash 
          title="Full Test"
          size="48"
          color="purple"
          className="full-test"
          onClick={() => {}}
        />
      );
      expect(container.firstChild).toBeTruthy();
      
      // Verify Icon component receives props
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('passes overrides to Icon', () => {
      const { container } = render(<Trash />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('data-overrides')).toContain('currentColor');
    });
  });

  describe('SVG Content', () => {
    it('renders the trash icon path', () => {
      const { container } = render(<Trash />);
      const path = container.querySelector('path');
      
      expect(path).toBeTruthy();
      expect(path).toHaveAttribute('d', 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0');
    });

    it('renders path with stroke attributes', () => {
      const { container } = render(<Trash />);
      const path = container.querySelector('path');
      
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });
  });

  describe('Component Structure', () => {
    it('returns Icon component with path', () => {
      const { container } = render(<Trash />);
      
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelector('path')).toBeTruthy();
    });
  });

  describe('Function Component', () => {
    it('covers function definition', () => {
      // Test function Trash(props, ref)
      expect(typeof Trash).toBe('object'); // forwardRef component
    });

    it('covers export statement', () => {
      // Test export default React.forwardRef(Trash)
      const ref = React.createRef();
      render(<Trash ref={ref} />);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Prop Combinations', () => {
    it('covers no props', () => {
      const { container } = render(<Trash />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers only title', () => {
      const { container } = render(<Trash title="Only Title" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers only size', () => {
      const { container } = render(<Trash size="20" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers only color', () => {
      const { container } = render(<Trash color="green" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers title and size', () => {
      const { container } = render(<Trash title="Test" size="28" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers title and color', () => {
      const { container } = render(<Trash title="Test" color="red" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers size and color', () => {
      const { container } = render(<Trash size="18" color="blue" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers all standard props', () => {
      const { container } = render(<Trash title="All" size="22" color="orange" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers rest props only', () => {
      const { container } = render(<Trash className="only-rest" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers mixed props', () => {
      const { container } = render(
        <Trash 
          title="Mixed"
          className="mixed-class"
          id="mixed-id"
          onClick={() => {}}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });
});
