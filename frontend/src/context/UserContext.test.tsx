import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { UserProvider, useUser } from './UserContext';
import { ClientEvent, ServerEvent } from '@wave-chat/shared';
import type { Socket } from 'socket.io-client';

// ─── Mocks ────────────────────────────────────────────────

// Mock localStorage utils
vi.mock('../utils/localStorage', () => ({
  saveUser: vi.fn(),
  getUser: vi.fn(),
  removeUser: vi.fn(),
}));

// Mock API service
vi.mock('../services/api', () => ({
  api: {
    validateRegistration: vi.fn(),
    generateConnectionId: vi.fn(),
    validateConnectionId: vi.fn(),
  },
}));

import { api } from '../services/api';
import { saveUser, getUser, removeUser } from '../utils/localStorage';

// Helper consumer
const TestConsumer = ({ onRender }: { onRender: (ctx: any) => void }) => {
  const ctx = useUser();
  onRender(ctx);
  return null;
};

// Mock socket
const createMockSocket = (): Socket =>
  ({
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  } as unknown as Socket);

describe('UserContext', () => {
  let socket: Socket;
  let contextRef: any;

  beforeEach(() => {
    socket = createMockSocket();
    contextRef = null;
    vi.clearAllMocks();
  });

  it('should register user successfully and emit USER_REGISTER', async () => {
    (api.validateRegistration as any).mockResolvedValue({
      success: true,
    });

    render(
      <UserProvider socket={socket}>
        <TestConsumer onRender={(ctx) => (contextRef = ctx)} />
      </UserProvider>
    );

    let result: boolean;

    await act(async () => {
      result = await contextRef.register('123', 'user1');
    });

    expect(result!).toBe(true);

    expect(api.validateRegistration).toHaveBeenCalledWith('123', 'user1');

    expect(saveUser).toHaveBeenCalledWith({
      connectionId: '123',
      name: 'user1',
    });

    expect(socket.emit).toHaveBeenCalledWith(ClientEvent.USER_REGISTER, {
      connectionId: '123',
      name: 'user1',
    });

    expect(contextRef.registrationError).toBeNull();
  });

  it('should set registrationError and clear user on USER_REGISTERED failure', () => {
    let registeredHandler: Function | undefined;

    (socket.on as any).mockImplementation((event: string, handler: Function) => {
      if (event === ServerEvent.USER_REGISTERED) {
        registeredHandler = handler;
      }
    });

    (getUser as any).mockReturnValue({
      connectionId: '123',
      name: 'user1',
    });

    render(
      <UserProvider socket={socket}>
        <TestConsumer onRender={(ctx) => (contextRef = ctx)} />
      </UserProvider>
    );

    act(() => {
      registeredHandler?.({
        success: false,
        error: 'Registration failed',
      });
    });

    expect(contextRef.registrationError).toBe('Registration failed');
    expect(contextRef.user).toBeNull();
    expect(removeUser).toHaveBeenCalled();
  });
});
