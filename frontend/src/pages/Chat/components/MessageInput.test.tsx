import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the input field and send button', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hai');

    expect(input).toHaveValue('Hai');
  });

  it('should call onSendMessage with trimmed message when clicking Send button', async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, '  Hello');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello');
  });

  it('should clear input after sending message', async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'bye');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(input).toHaveValue('');
  });

  it('should call onSendMessage when pressing Enter', async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'test{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('test');
  });

  it('should disable send button when input is empty', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should disable send button when input contains only whitespace', async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, '   ');

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has content', async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hello');

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('should disable input and button when disabled prop is true', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});
