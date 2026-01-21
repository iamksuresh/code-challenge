import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';
import { ChatMessage } from '../../../types';

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

describe('MessageList', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      from: '456',
      fromName: 'akash',
      content: 'Hello there!',
      timestamp: '2024-01-01T10:30:00Z',
      isOwn: false,
    },
    {
      id: '2',
      from: '123',
      fromName: 'TestUser',
      content: 'Hi akash!',
      timestamp: '2024-01-01T10:31:00Z',
      isOwn: true,
    },
    {
      id: '3',
      from: '456',
      fromName: 'akash',
      content: 'How are you?',
      timestamp: '2024-01-01T10:32:00Z',
      isOwn: false,
    },
  ];

  it('should render empty state when there are no messages', () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });

  it('should render all messages', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi akash!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('should display sender name for messages from others', () => {
    render(<MessageList messages={mockMessages} />);

    // akash's messages should show her name
    const akashNames = screen.getAllByText('akash');
    expect(akashNames.length).toBe(2); // Two messages from akash
  });

  it('should display sender connection ID for messages from others', () => {
    render(<MessageList messages={mockMessages} />);

    // akash's connection ID should be shown for her messages
    const connectionIds = screen.getAllByText('(456)');
    expect(connectionIds.length).toBe(2); // Two messages from akash
  });

  it('should not display sender info for own messages', () => {
    const ownMessage: ChatMessage[] = [
      {
        id: '1',
        from: '123',
        fromName: 'TestUser',
        content: 'My own message',
        timestamp: '2024-01-01T10:30:00Z',
        isOwn: true,
      },
    ];

    render(<MessageList messages={ownMessage} />);

    // Own message content should be there
    expect(screen.getByText('My own message')).toBeInTheDocument();

    expect(screen.queryByText('TestUser')).not.toBeInTheDocument();
    expect(screen.queryByText('(123)')).not.toBeInTheDocument();
  });

  it('should scroll to bottom when messages change', () => {
    const { rerender } = render(<MessageList messages={mockMessages} />);

    // Initial render should scroll
    expect(mockScrollIntoView).toHaveBeenCalled();

    mockScrollIntoView.mockClear();

    // Add a new message
    const updatedMessages = [
      ...mockMessages,
      {
        id: '4',
        from: '456',
        fromName: 'akash',
        content: 'New message!',
        timestamp: '2024-01-01T10:33:00Z',
        isOwn: false,
      },
    ];

    rerender(<MessageList messages={updatedMessages} />);

    // Should scroll again when messages update
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it('should render messages with long content correctly', () => {
    const longMessage: ChatMessage[] = [
      {
        id: '1',
        from: '456',
        fromName: 'akash',
        content: 'This is a very long message that contains a lot of text and should be displayed properly without breaking the layout of the chat interface.',
        timestamp: '2024-01-01T10:30:00Z',
        isOwn: false,
      },
    ];

    render(<MessageList messages={longMessage} />);

    expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
  });

});
