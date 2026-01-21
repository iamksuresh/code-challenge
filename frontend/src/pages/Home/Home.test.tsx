import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from './Home';

// Mock functions
const mockLogout = vi.fn();

// Default mock values
let mockIsRegistered = false;
let mockIsConnected = false;
let mockRegistrationError: string | null = null;
let mockIncomingRequest: { from: string; fromName: string } | null = null;
let mockBusyUser: { connectionId: string; name: string } | null = null;

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    isRegistered: mockIsRegistered,
    isConnected: mockIsConnected,
    registrationError: mockRegistrationError,
    logout: mockLogout,
  }),
}));

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    incomingRequest: mockIncomingRequest,
    busyUser: mockBusyUser,
  }),
}));

vi.mock('../../utils/localStorage', () => ({
  hasStoredUser: () => mockIsConnected && mockIsRegistered,
}));

// Mock child components to isolate Home page testing
vi.mock('./components/RegisterForm', () => ({
  RegisterForm: () => <div data-testid="register-form">RegisterForm</div>,
}));

vi.mock('./components/ChatRequestForm', () => ({
  ChatRequestForm: () => <div data-testid="chat-request-form">ChatRequestForm</div>,
}));

vi.mock('./components/IncomingRequestModal', () => ({
  IncomingRequestModal: () => <div data-testid="incoming-request-modal">IncomingRequestModal</div>,
}));

vi.mock('./components/BusyUserModal', () => ({
  BusyUserModal: () => <div data-testid="busy-user-modal">BusyUserModal</div>,
}));

describe('pages/Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRegistered = false;
    mockIsConnected = false;
    mockRegistrationError = null;
    mockIncomingRequest = null;
    mockBusyUser = null;
  });

  it('should render Home page with app title', () => {
    render(<Home />);

    expect(screen.getByText('Wave Chat')).toBeInTheDocument();
  });

  it('should show RegisterForm when user is not registered', () => {
    mockIsRegistered = false;

    render(<Home />);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-request-form')).not.toBeInTheDocument();
  });

  it('should show ChatRequestForm when user is registered', () => {
    mockIsRegistered = true;

    render(<Home />);

    expect(screen.getByTestId('chat-request-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('should show "Connected" status when connected and registered', () => {
    mockIsConnected = true;
    mockIsRegistered = true;

    render(<Home />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show "Not Connected" status when not connected', () => {
    mockIsConnected = false;

    render(<Home />);

    expect(screen.getByText('Not Connected')).toBeInTheDocument();
  });

  it('should show multi-tab error when registration error includes "another tab"', () => {
    mockRegistrationError = 'Wave Chat is already open in another tab';

    render(<Home />);

    expect(screen.getByText('Already Open')).toBeInTheDocument();
    expect(screen.getByText('Wave Chat is already open in another tab')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chat-request-form')).not.toBeInTheDocument();
  });

  it('should render IncomingRequestModal when there is an incoming request', () => {
    mockIncomingRequest = { from: '456', fromName: 'Alice' };

    render(<Home />);

    expect(screen.getByTestId('incoming-request-modal')).toBeInTheDocument();
  });

  it('should not render IncomingRequestModal when there is no incoming request', () => {
    mockIncomingRequest = null;

    render(<Home />);

    expect(screen.queryByTestId('incoming-request-modal')).not.toBeInTheDocument();
  });

  it('should render BusyUserModal when there is a busy user', () => {
    mockBusyUser = { connectionId: '789', name: 'Bob' };

    render(<Home />);

    expect(screen.getByTestId('busy-user-modal')).toBeInTheDocument();
  });

  it('should not render BusyUserModal when there is no busy user', () => {
    mockBusyUser = null;

    render(<Home />);

    expect(screen.queryByTestId('busy-user-modal')).not.toBeInTheDocument();
  });
});
