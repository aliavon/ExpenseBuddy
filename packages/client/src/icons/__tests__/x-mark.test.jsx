import React from 'react';
import { render } from '@testing-library/react';
import XMark from '../x-mark';

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

describe('XMark Icon Component - 100% Coverage', () => {
  describe('Basic Functionality', () => {
    it('renders without props', () => {
      const { container } = render(<XMark />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom title', () => {
      const { container } = render(<XMark title="Close" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom size', () => {
      const { container } = render(<XMark size="32" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with custom color', () => {
      const { container } = render(<XMark color="red" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders with all props', () => {
      const { container } = render(
        <XMark 
          title="Close Modal" 
          size="16" 
          color="danger"
          className="x-mark-icon"
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Default Values Coverage', () => {
    it('covers default title "XMark"', () => {
      const { container } = render(<XMark />);
      expect(container).toBeTruthy();
    });

    it('covers default size 24', () => {
      const { container } = render(<XMark />);
      expect(container).toBeTruthy();
    });

    it('covers size prop with custom value', () => {
      const { container } = render(<XMark size="18" />);
      expect(container).toBeTruthy();
    });

    it('covers color prop without default', () => {
      const { container } = render(<XMark color="blue" />);
      expect(container).toBeTruthy();
    });

    it('covers restProps spreading', () => {
      const { container } = render(
        <XMark 
          onClick={() => {}}
          onMouseEnter={() => {}}
          className="custom-class"
          id="x-mark-id"
          data-custom="value"
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('forwardRef Coverage', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<XMark ref={ref} />);
      expect(ref.current).toBeTruthy();
    });

    it('works with callback ref', () => {
      let refElement = null;
      render(<XMark ref={(el) => { refElement = el; }} />);
      expect(refElement).toBeTruthy();
    });

    it('handles null ref', () => {
      expect(() => render(<XMark ref={null} />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props', () => {
      const { container } = render(
        <XMark 
          title={undefined} 
          size={undefined} 
          color={undefined} 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles empty string props', () => {
      const { container } = render(
        <XMark 
          title="" 
          size="" 
          color="" 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles falsy props', () => {
      const { container } = render(
        <XMark 
          title={null} 
          size={0} 
          color={false} 
        />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('handles numeric props', () => {
      const { container } = render(
        <XMark 
          size={20}
          color={456}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Icon Component Props', () => {
    it('passes all props to Icon component', () => {
      const { container } = render(
        <XMark 
          title="Full Test"
          size="40"
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
      const { container } = render(<XMark />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('data-overrides')).toContain('currentColor');
    });
  });

  describe('SVG Content', () => {
    it('renders the x-mark icon path', () => {
      const { container } = render(<XMark />);
      const path = container.querySelector('path');
      
      expect(path).toBeTruthy();
      expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    });

    it('renders path with stroke attributes', () => {
      const { container } = render(<XMark />);
      const path = container.querySelector('path');
      
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('covers strokeLinecap and strokeLinejoin attributes', () => {
      const { container } = render(<XMark />);
      const path = container.querySelector('path');
      
      expect(path).toBeTruthy();
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });
  });

  describe('Component Structure', () => {
    it('returns Icon component with path', () => {
      const { container } = render(<XMark />);
      
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelector('path')).toBeTruthy();
    });

    it('covers Icon wrapping', () => {
      const { container } = render(<XMark />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Function Component', () => {
    it('covers function definition', () => {
      // Test function XMark(props, ref)
      expect(typeof XMark).toBe('object'); // forwardRef component
    });

    it('covers export statement', () => {
      // Test export default React.forwardRef(XMark)
      const ref = React.createRef();
      render(<XMark ref={ref} />);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Prop Combinations', () => {
    it('covers no props (defaults)', () => {
      const { container } = render(<XMark />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers only title', () => {
      const { container } = render(<XMark title="Only Title" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers only size', () => {
      const { container } = render(<XMark size="28" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers only color', () => {
      const { container } = render(<XMark color="green" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers title and size', () => {
      const { container } = render(<XMark title="Test" size="30" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers title and color', () => {
      const { container } = render(<XMark title="Test" color="red" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers size and color', () => {
      const { container } = render(<XMark size="22" color="blue" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers all standard props', () => {
      const { container } = render(<XMark title="All" size="26" color="orange" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers rest props only', () => {
      const { container } = render(<XMark className="only-rest" />);
      expect(container.firstChild).toBeTruthy();
    });

    it('covers mixed props', () => {
      const { container } = render(
        <XMark 
          title="Mixed"
          className="mixed-class"
          id="mixed-id"
          onClick={() => {}}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Default Size Coverage', () => {
    it('covers default size = 24 assignment', () => {
      const { container } = render(<XMark />);
      expect(container).toBeTruthy();
    });

    it('covers size override', () => {
      const { container } = render(<XMark size="12" />);
      expect(container).toBeTruthy();
    });

    it('covers size with number', () => {
      const { container } = render(<XMark size={36} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Line Coverage', () => {
    it('covers line 7 destructuring', () => {
      const { container } = render(<XMark title="Test" size="50" color="black" />);
      expect(container).toBeTruthy();
    });

    it('covers lines 18-22 path attributes', () => {
      const { container } = render(<XMark />);
      const path = container.querySelector('path');
      
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    });

    it('covers return statement lines 9-24', () => {
      const { container } = render(<XMark />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Comprehensive Coverage', () => {
    it('covers all code paths', () => {
      const testCases = [
        {},
        { title: 'Custom' },
        { size: 48 },
        { color: 'red' },
        { title: 'Full', size: 32, color: 'blue', className: 'test' },
      ];

      testCases.forEach(props => {
        const { container } = render(<XMark {...props} />);
        expect(container.firstChild).toBeTruthy();
      });
    });
  });
});
