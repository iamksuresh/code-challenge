import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatRequestForm } from './ChatRequestForm';

// Mock data
const mockUser = {
  connectionId: '123',
  name: 'TestUser',
};

// Mock functions
const mockLogout = vi.fn();
const mockSendChatRequest = vi.fn();
const mockClearRequestError = vi.fn();

// Default mock values
let mockPendingRequest: { targetId: string; targetName?: string } | null = null;
let mockRequestError: string | null = null;

vi.mock('../../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

vi.mock('../../../context/ChatContext', () => ({
  useChat: () => ({
    sendChatRequest: mockSendChatRequest,
    pendingRequest: mockPendingRequest,
    requestError: mockRequestError,
    clearRequestError: mockClearRequestError,
  }),
}));

describe('ChatRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPendingRequest = null;
    mockRequestError = null;
  });

  it('should show error when trying to chat with yourself', async () => {
    const user = userEvent.setup();

    render(<ChatRequestForm />);

    // Enter your own connection ID
    const targetIdInput = screen.getByPlaceholderText('Enter Connection ID');
    await user.type(targetIdInput, '123');

    // Click Start Chat button
    const startChatButton = screen.getByRole('button', { name: /start chat/i });
    await user.click(startChatButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('You cannot chat with yourself')).toBeInTheDocument();
    });

    // sendChatRequest should NOT be called
    expect(mockSendChatRequest).not.toHaveBeenCalled();
  });

  it('should show "User not found" error for invalid connection ID 999', async () => {
    // Simulate the error response from the server
    mockRequestError = 'User 999 not found';

    const user = userEvent.setup();

    const { rerender } = render(<ChatRequestForm />);

    // Enter an invalid connection ID
    const targetIdInput = screen.getByPlaceholderText('Enter Connection ID');
    await user.type(targetIdInput, '999');

    // Click Start Chat button
    const startChatButton = screen.getByRole('button', { name: /start chat/i });
    await user.click(startChatButton);

    // sendChatRequest should be called
    await waitFor(() => {
      expect(mockSendChatRequest).toHaveBeenCalledWith('999');
    });

    // Simulate server response with error - rerender with the error state
    rerender(<ChatRequestForm />);

    // Should show error message
    expect(screen.getByText('User 999 not found')).toBeInTheDocument();
  });

  it('should show "Waiting for response... from <USER NAME>" for a valid user', async () => {
    const user = userEvent.setup();

    const { rerender } = render(<ChatRequestForm />);

    // Enter a valid other user's connection ID
    const targetIdInput = screen.getByPlaceholderText('Enter Connection ID');
    await user.type(targetIdInput, '456');

    // Click Start Chat button
    const startChatButton = screen.getByRole('button', { name: /start chat/i });
    await user.click(startChatButton);

    // sendChatRequest should be called
    await waitFor(() => {
      expect(mockSendChatRequest).toHaveBeenCalledWith('456');
    });

    // Simulate pending request with target user name
    mockPendingRequest = { targetId: '456', targetName: 'Alice' };
    rerender(<ChatRequestForm />);

    // Should show waiting message with user name
    expect(screen.getByText(/waiting for response\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText('from Alice')).toBeInTheDocument();
  });

  it('should display user info correctly', () => {
    render(<ChatRequestForm />);

    // User name should be displayed
    expect(screen.getByText('TestUser')).toBeInTheDocument();

    // User connection ID should be displayed
    expect(screen.getByText('ID: 123')).toBeInTheDocument();
  });

  it('should disable input and button when request is pending', async () => {
    mockPendingRequest = { targetId: '456' };

    render(<ChatRequestForm />);

    const targetIdInput = screen.getByPlaceholderText('Enter Connection ID');
    const submitButton = screen.getByRole('button', { name: /waiting/i });

    expect(targetIdInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
