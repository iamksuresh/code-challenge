import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chat } from './Chat';
import { ChatMessage } from '../../types';

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

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
  startedAt: '2026-01-21T12:54:48.693Z',
};

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    from: '456',
    fromName: 'PartnerUser',
    content: 'Hello!',
    timestamp: '2026-01-21T12:57:48.693Z',
    isOwn: false,
  },
];

// Mock functions
const mockSendMessage = vi.fn();

// Default mock values
let mockUserValue: typeof mockUser | null = mockUser;
let mockIsRegistered = true;
let mockSessionValue: typeof mockSession | null = mockSession;
let mockMessagesValue: ChatMessage[] = mockMessages;

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUserValue,
    isRegistered: mockIsRegistered,
  }),
}));

vi.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    session: mockSessionValue,
    messages: mockMessagesValue,
    sendMessage: mockSendMessage,
  }),
}));

// Mock child components to isolate Chat page testing
vi.mock('./components/ChatHeader', () => ({
  ChatHeader: () => <div data-testid="chat-header">ChatHeader</div>,
}));

vi.mock('./components/MessageList', () => ({
  MessageList: ({ messages }: { messages: ChatMessage[] }) => (
    <div data-testid="message-list">MessageList ({messages.length} messages)</div>
  ),
}));

vi.mock('./components/MessageInput', () => ({
  MessageInput: ({ onSendMessage }: { onSendMessage: (msg: string) => void }) => (
    <div data-testid="message-input">
      <button onClick={() => onSendMessage('test message')}>Send Test</button>
    </div>
  ),
}));

describe('pages/Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserValue = mockUser;
    mockIsRegistered = true;
    mockSessionValue = mockSession;
    mockMessagesValue = mockMessages;
  });

  it('should render Chat page with all components', () => {
    render(<Chat />);

    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('should pass messages to MessageList', () => {
    render(<Chat />);

    expect(screen.getByText('MessageList (1 messages)')).toBeInTheDocument();
  });

  it('should call sendMessage when MessageInput triggers onSendMessage', async () => {
    render(<Chat />);

    const sendButton = screen.getByText('Send Test');
    sendButton.click();

    expect(mockSendMessage).toHaveBeenCalledWith('test message');
  });

  it('should navigate to home when user is not registered', () => {
    mockIsRegistered = false;

    render(<Chat />);

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should navigate to home when session is not available', () => {
    mockSessionValue = null;

    render(<Chat />);

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

});
