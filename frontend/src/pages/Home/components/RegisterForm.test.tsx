import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

// Mock the UserContext
const mockRegister = vi.fn();
const mockGenerateConnectionId = vi.fn();
const mockValidateConnectionId = vi.fn();

vi.mock('../../../context/UserContext', () => ({
  useUser: () => ({
    isRegistering: false,
    registrationError: null,
    register: mockRegister,
    generateConnectionId: mockGenerateConnectionId,
    validateConnectionId: mockValidateConnectionId,
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: connection ID is valid and available
    mockValidateConnectionId.mockResolvedValue({ valid: true, available: true });
    mockRegister.mockResolvedValue(true);
  });

  it('should successfully register with a valid name and connection ID', async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    // Enter a valid name
    const nameInput = screen.getByPlaceholderText('Your name');
    await user.type(nameInput, 'JohnDoe');

    // Enter a valid connection ID
    const connectionIdInput = screen.getByPlaceholderText('Enter connection Id');
    await user.type(connectionIdInput, '123');

    // Wait for validation to complete
    await waitFor(() => {
      expect(mockValidateConnectionId).toHaveBeenCalledWith('123');
    });

    // Wait for the "Available!" message to appear
    await waitFor(() => {
      expect(screen.getByText('Available!')).toBeInTheDocument();
    });

    // Click the Register button
    const registerButton = screen.getByRole('button', { name: /register/i });
    expect(registerButton).not.toBeDisabled();
    await user.click(registerButton);

    // Verify register was called with correct arguments
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('123', 'JohnDoe');
    });
  });

  it('should show validation error for name less than 3 characters', async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    const nameInput = screen.getByPlaceholderText('Your name');
    await user.type(nameInput, 'Ab');

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('should generate a connection ID when clicking Generate ID button', async () => {
    const user = userEvent.setup();
    mockGenerateConnectionId.mockResolvedValue('456');

    render(<RegisterForm />);

    const generateButton = screen.getByRole('button', { name: /generate id/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockGenerateConnectionId).toHaveBeenCalled();
    });
  });

  it('should show error for taken connection ID', async () => {
    const user = userEvent.setup();
    mockValidateConnectionId.mockResolvedValue({ valid: true, available: false });

    render(<RegisterForm />);

    const connectionIdInput = screen.getByPlaceholderText('Enter connection Id');
    await user.type(connectionIdInput, '999');

    await waitFor(() => {
      expect(screen.getByText('This connection ID is already in use')).toBeInTheDocument();
    });
  });
});
