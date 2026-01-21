import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ChatProvider, useChat } from './ChatContext';
import { ClientEvent, ServerEvent } from '@wave-chat/shared';
import type { Socket } from 'socket.io-client';

// ─── Mocks ────────────────────────────────────────────────

// Mock UserContext
vi.mock('./UserContext', () => ({
  useUser: () => ({
    user: {
      connectionId: '999',
      name: 'Test User',
    },
  }),
}));

// Mock localStorage utils
vi.mock('../utils/localStorage', () => ({
  getChatHistory: vi.fn(() => []),
  addMessageToHistory: vi.fn(),
  saveChatHistory: vi.fn(),
}));

// Helper test component to access context
const TestConsumer = ({ onRender }: { onRender: (ctx: any) => void }) => {
  const ctx = useChat();
  onRender(ctx);
  return null;
};

// Mock socket
const createMockSocket = (): Socket =>
  ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  } as unknown as Socket);

describe('ChatContext', () => {
  let socket: Socket;
  let contextRef: any;

  beforeEach(() => {
    socket = createMockSocket();
    contextRef = null;
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────
  // Test 1
  // ────────────────────────────────────────────────────────
  it('should emit CHAT_REQUEST and set pendingRequest when sendChatRequest is called', () => {
    render(
      <ChatProvider socket={socket}>
        <TestConsumer onRender={(ctx) => (contextRef = ctx)} />
      </ChatProvider>
    );

    act(() => {
      contextRef.sendChatRequest('111');
    });

    expect(socket.emit).toHaveBeenCalledWith(ClientEvent.CHAT_REQUEST, {
      targetConnectionId: '111',
    });

    expect(contextRef.pendingRequest).toEqual({
      targetId: '111',
    });

    expect(contextRef.requestError).toBeNull();
  });

  // ────────────────────────────────────────────────────────
  // Test 2
  // ────────────────────────────────────────────────────────
  it('should add a message to messages state when CHAT_MESSAGE_RECEIVED is received', () => {
    let messageHandler: Function | undefined;

    // Capture the message handler passed to socket.on
    (socket.on as any).mockImplementation((event: string, handler: Function) => {
      if (event === ServerEvent.CHAT_MESSAGE_RECEIVED) {
        messageHandler = handler;
      }
    });

    render(
      <ChatProvider socket={socket}>
        <TestConsumer onRender={(ctx) => (contextRef = ctx)} />
      </ChatProvider>
    );

    act(() => {
      messageHandler?.({
        id: 'msg-1',
        from: '111',
        fromName: 'Alice',
        content: 'Hello!',
        timestamp: new Date().toISOString(),
      });
    });

    expect(contextRef.messages).toHaveLength(1);
    expect(contextRef.messages[0]).toMatchObject({
      id: 'msg-1',
      from: '111',
      fromName: 'Alice',
      content: 'Hello!',
      isOwn: false,
    });
  });
});
