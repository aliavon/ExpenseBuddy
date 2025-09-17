import React from 'react';
/**
 * Common mocks for testing new authentication and family components
 */

// Mock AuthContext
export const mockAuthContext = {
  user: {
    id: 'test-user-id',
    firstName: 'John',
    lastName: 'Doe',
    middleName: '',
    email: 'john@test.com',
    isEmailVerified: true,
    familyId: 'test-family-id',
    roleInFamily: 'OWNER',
    lastLoginAt: '2023-01-01',
    createdAt: '2023-01-01',
  },
  family: null,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refetchUser: jest.fn(),
  error: null,
};

// Mock Apollo Client
export const mockApolloClient = {
  query: jest.fn(),
  mutate: jest.fn(),
  watchQuery: jest.fn(),
  readQuery: jest.fn(),
  writeQuery: jest.fn(),
  cache: {
    readQuery: jest.fn(),
    writeQuery: jest.fn(),
    evict: jest.fn(),
    gc: jest.fn(),
  },
};

// Mock GraphQL responses
export const mockFamilyMembers = [
  {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    roleInFamily: 'OWNER',
    createdAt: '2023-01-01',
  }, {
    id: 'member-2',
    firstName: 'Jane',
    lastName: 'Doe',
    roleInFamily: 'MEMBER',
    createdAt: '2023-01-02',
  },
];

export const mockJoinRequests = [
  {
    id: 'request-1',
    user: {
      id: 'user-3',
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@test.com',
    },
    message: 'Please let me join your family',
    status: 'PENDING',
    requestedAt: '2023-01-03',
  },
];

// Mock BaseUI components
export const mockBaseUIComponents = () => {
  jest.mock('baseui/block', () => ({
    Block: ({ children, ...props }) => <div data-testid="block" {...props}>{children}</div>,
  }));

  jest.mock('baseui/card', () => ({
    Card: ({ children, ...props }) => <section data-testid="card" {...props}>{children}</section>,
    StyledBody: ({ children, ...props }) => <div data-testid="card-body" {...props}>{children}</div>,
    StyledAction: ({ children, ...props }) => <div data-testid="card-action" {...props}>{children}</div>,
  }));

  jest.mock('baseui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }) => (
      <button
        data-testid="button"
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    ),
    SHAPE: { round: 'round' },
    SIZE: { mini: 'mini', compact: 'compact' },
    KIND: { primary: 'primary', secondary: 'secondary' },
  }));

  jest.mock('baseui/input', () => ({
    Input: ({ value, onChange, placeholder, ...props }) => (
      <input
        data-testid="input"
        value={value}
        onChange={e => onChange && onChange({ target: { value: e.target.value } })}
        placeholder={placeholder}
        {...props}
      />
    ),
  }));

  jest.mock('baseui/textarea', () => ({
    Textarea: ({ value, onChange, placeholder, ...props }) => (
      <textarea
        data-testid="textarea"
        value={value}
        onChange={e => onChange && onChange({ target: { value: e.target.value } })}
        placeholder={placeholder}
        {...props}
      />
    ),
  }));

  jest.mock('baseui/modal', () => ({
    Modal: ({ isOpen, onClose, children, ...props }) =>
      isOpen ? (
        <div data-testid="modal" {...props}>
          <button data-testid="modal-close" onClick={onClose}>×</button>
          {children}
        </div>
      ) : null,
    ModalHeader: ({ children, ...props }) => <div data-testid="modal-header" {...props}>{children}</div>,
    ModalBody: ({ children, ...props }) => <div data-testid="modal-body" {...props}>{children}</div>,
    ModalFooter: ({ children, ...props }) => <div data-testid="modal-footer" {...props}>{children}</div>,
    ModalButton: ({ children, onClick, ...props }) => (
      <button
        data-testid="modal-button" onClick={onClick}
        {...props}>
        {children}
      </button>
    ),
    SIZE: { default: 'default', full: 'full' },
    ROLE: { dialog: 'dialog' },
  }));

  jest.mock('baseui/typography', () => ({
    LabelMedium: ({ children, ...props }) => <label data-testid="label-medium" {...props}>{children}</label>,
    LabelLarge: ({ children, ...props }) => <label data-testid="label-large" {...props}>{children}</label>,
    ParagraphSmall: ({ children, ...props }) => <p data-testid="paragraph-small" {...props}>{children}</p>,
    ParagraphMedium: ({ children, ...props }) => <p data-testid="paragraph-medium" {...props}>{children}</p>,
    HeadingMedium: ({ children, ...props }) => <h3 data-testid="heading-medium" {...props}>{children}</h3>,
    HeadingLarge: ({ children, ...props }) => <h2 data-testid="heading-large" {...props}>{children}</h2>,
  }));

  jest.mock('baseui/avatar', () => ({
    Avatar: ({ name, size, ...props }) => (
      <div
        data-testid="avatar" data-name={name}
        data-size={size} {...props}>
        {name?.charAt(0)}
      </div>
    ),
    SIZE: { scale800: 'scale800' },
  }));

  jest.mock('baseui/list', () => ({
    ListItem: ({ children, ...props }) => <li data-testid="list-item" {...props}>{children}</li>,
    ListItemLabel: ({ children, ...props }) => <span data-testid="list-item-label" {...props}>{children}</span>,
  }));

  jest.mock('baseui/divider', () => ({
    StyledDivider: props => <hr data-testid="divider" {...props} />,
  }));

  jest.mock('baseui/spinner', () => ({
    Spinner: props => <div data-testid="spinner" {...props}>Loading...</div>,
  }));
};

// Mock react-router-dom
export const mockReactRouter = () => {
  jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
    Link: ({ children, to, ...props }) => (
      <a
        href={to} data-testid="link"
        {...props}>
        {children}
      </a>
    ),
  }));
};

// Mock toaster
export const mockToaster = () => {
  jest.mock('baseui/toast', () => ({
    toaster: {
      positive: jest.fn(),
      negative: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
  }));
};

// Test utilities
export const createMockMutation = (loading = false, error = null, data = null) => [
  jest.fn().mockImplementation(config => {
    if (config?.onCompleted) {
      setTimeout(() => config.onCompleted(data), 0);
    }
    if (config?.onError && error) {
      setTimeout(() => config.onError(error), 0);
    }
    return Promise.resolve({ data });
  }), { loading, error, data },
];

export const createMockQuery = (loading = false, error = null, data = null) => ({
  loading,
  error,
  data,
  refetch: jest.fn(),
  fetchMore: jest.fn(),
  networkStatus: 7,
});
