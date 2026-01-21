import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHeader } from './ChatHeader';

// Mock data
const mockUser = {
  connectionId: '123',
  name: 'TestUser',
};

const mockSession = {
  sessionId: 'session-1',
  partner: {
    connectionId: '456',
    name: 'PartnerUser',
  },
  isInitiator: true,
  startedAt: '2024-01-01T00:00:00Z',
};

// Mock functions
const mockLeaveChat = vi.fn();

// Default mock values
let mockUserValue: typeof mockUser | null = mockUser;
let mockSessionValue: typeof mockSession | null = mockSession;

vi.mock('../../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUserValue,
  }),
}));

vi.mock('../../../context/ChatContext', () => ({
  useChat: () => ({
    session: mockSessionValue,
    leaveChat: mockLeaveChat,
  }),
}));

describe('ChatHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserValue = mockUser;
    mockSessionValue = mockSession;
  });

  it('should render partner info correctly', () => {
    render(<ChatHeader />);

    expect(screen.getByText('PartnerUser')).toBeInTheDocument();

    // Partner connection ID should be displayed
    expect(screen.getByText('(456)')).toBeInTheDocument();
  });

  it('should render current user info correctly', () => {
    render(<ChatHeader />);

    // Current user name should be displayed
    expect(screen.getByText('TestUser')).toBeInTheDocument();

    // Current user ID should be displayed
    expect(screen.getByText('(123)')).toBeInTheDocument();

    // "You:" label should be displayed
    expect(screen.getByText('You:')).toBeInTheDocument();
  });

  it('should render Leave Chat button', () => {
    render(<ChatHeader />);

    const leaveButton = screen.getByRole('button', { name: /leave chat/i });
    expect(leaveButton).toBeInTheDocument();
  });

  it('should call leaveChat when Leave Chat button is clicked', async () => {
    const user = userEvent.setup();

    render(<ChatHeader />);

    const leaveButton = screen.getByRole('button', { name: /leave chat/i });
    await user.click(leaveButton);

    expect(mockLeaveChat).toHaveBeenCalledTimes(1);
  });

});
