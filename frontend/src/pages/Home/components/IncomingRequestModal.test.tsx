import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomingRequestModal } from './IncomingRequestModal';

// Mock functions
const mockRespondToRequest = vi.fn();

// Default mock values
let mockIncomingRequest: { from: string; fromName: string } | null = null;

vi.mock('../../../context/ChatContext', () => ({
  useChat: () => ({
    incomingRequest: mockIncomingRequest,
    respondToRequest: mockRespondToRequest,
  }),
}));

describe('IncomingRequestModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIncomingRequest = null;
  });

  it('should not render when there is no incoming request', () => {
    mockIncomingRequest = null;

    const { container } = render(<IncomingRequestModal />);

    // Modal should not be in the DOM
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when there is an incoming request', () => {
    mockIncomingRequest = {
      from: '456',
      fromName: 'Alice',
    };

    render(<IncomingRequestModal />);

    // Modal should be visible with the incoming request title
    expect(screen.getByText('Incoming Chat Request')).toBeInTheDocument();

    // Should show the requester's name and connection ID in the message
    // Text is split across elements, so use a function matcher
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'STRONG' && content.includes('Alice') && content.includes('456');
    })).toBeInTheDocument();

    // Accept and Decline buttons should be present
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('should call respondToRequest with true when Accept is clicked', async () => {
    const user = userEvent.setup();
    mockIncomingRequest = {
      from: '789',
      fromName: 'Bob',
    };

    render(<IncomingRequestModal />);

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    await user.click(acceptButton);

    expect(mockRespondToRequest).toHaveBeenCalledWith('789', true);
  });

  it('should call respondToRequest with false when Decline is clicked', async () => {
    const user = userEvent.setup();
    mockIncomingRequest = {
      from: '789',
      fromName: 'Bob',
    };

    render(<IncomingRequestModal />);

    const declineButton = screen.getByRole('button', { name: /decline/i });
    await user.click(declineButton);

    expect(mockRespondToRequest).toHaveBeenCalledWith('789', false);
  });

  it('should display correct user info in the modal', () => {
    mockIncomingRequest = {
      from: '555',
      fromName: 'Charlie',
    };

    render(<IncomingRequestModal />);

    // Check user name and connection ID are displayed in the message
    // Text is split across elements, so use a function matcher
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'STRONG' && content.includes('Charlie') && content.includes('555');
    })).toBeInTheDocument();
  });
});
