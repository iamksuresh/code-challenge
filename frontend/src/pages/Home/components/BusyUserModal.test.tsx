import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusyUserModal } from './BusyUserModal';

// Mock functions
const mockClearBusyUser = vi.fn();

// Default mock values
let mockBusyUser: { connectionId: string; name: string } | null = null;

vi.mock('../../../context/ChatContext', () => ({
  useChat: () => ({
    busyUser: mockBusyUser,
    clearBusyUser: mockClearBusyUser,
  }),
}));

describe('BusyUserModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBusyUser = null;
  });

  it('should not render when there is no busy user', () => {
    mockBusyUser = null;

    const { container } = render(<BusyUserModal />);

    expect(container.firstChild).toBeNull();
  });

  it('should render modal when there is a busy user', () => {
    mockBusyUser = {
      connectionId: '456',
      name: 'prema',
    };

    render(<BusyUserModal />);

    expect(screen.getByText('User Unavailable')).toBeInTheDocument();
  });

  it('should display busy user name and connection ID', () => {
    mockBusyUser = {
      connectionId: '789',
      name: 'Bob',
    };

    render(<BusyUserModal />);

    expect(screen.getByText('Bob (789) is currently in another chat.')).toBeInTheDocument();
  });

  it('should render OK button', () => {
    mockBusyUser = {
      connectionId: '456',
      name: 'prema',
    };

    render(<BusyUserModal />);

    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
  });

  it('should display correct user info for different users', () => {
    mockBusyUser = {
      connectionId: '123',
      name: 'chetan',
    };

    render(<BusyUserModal />);

    expect(screen.getByText('chetan (123) is currently in another chat.')).toBeInTheDocument();
  });
});
