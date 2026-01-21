import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import { ClientEvent, ServerEvent } from '@wave-chat/shared';
import type {
  UserRegisteredPayload,
  ChatRequestResultPayload,
  ChatIncomingRequestPayload,
  ChatStartedPayload,
  ChatMessageReceivedPayload,
  ChatEndedPayload,
} from '@wave-chat/shared';
import { createTestServer, startServer, waitForEvent, TestServer } from '../testServer';

describe('WebSocket Chat Events', () => {
  let testServer: TestServer;
  let serverUrl: string;
  let sockets: Socket[] = [];

  const createSocket = (): Socket => {
    const socket = ioClient(serverUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });
    sockets.push(socket);
    return socket;
  };

  const connectSocket = (socket: Socket): Promise<void> => {
    return new Promise((resolve) => {
      socket.connect();
      socket.on('connect', () => resolve());
    });
  };

  const registerUser = async (
    socket: Socket,
    connectionId: string,
    name: string
  ): Promise<UserRegisteredPayload> => {
    const promise = waitForEvent<UserRegisteredPayload>(socket, ServerEvent.USER_REGISTERED);
    socket.emit(ClientEvent.USER_REGISTER, { connectionId, name });
    return promise;
  };

  beforeAll(async () => {
    testServer = createTestServer();
    serverUrl = await startServer(testServer);
  });

  afterAll(async () => {
    await testServer.close();
  });

  afterEach(() => {
    // Disconnect and cleanup all sockets
    sockets.forEach((socket) => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    sockets = [];
  });

  describe('USER_REGISTER event', () => {
    it('should register a new user successfully', async () => {
      const socket = createSocket();
      await connectSocket(socket);

      const result = await registerUser(socket, '001', 'user1');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail registration with invalid connection ID format', async () => {
      const socket = createSocket();
      await connectSocket(socket);

      const result = await registerUser(socket, 'abc', 'user1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle reconnection for existing user', async () => {
      const socket1 = createSocket();
      await connectSocket(socket1);
      await registerUser(socket1, '003', 'user2');
      socket1.disconnect();

      // Wait a bit for disconnect to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      const socket2 = createSocket();
      await connectSocket(socket2);

      const result = await registerUser(socket2, '003', 'user2');

      expect(result.success).toBe(true);
    });
  });

  describe('CHAT_REQUEST event', () => {
    it('should send chat request to target user', async () => {
      const socket1 = createSocket();
      const socket2 = createSocket();
      await connectSocket(socket1);
      await connectSocket(socket2);

      await registerUser(socket1, '101', 'user1');
      await registerUser(socket2, '102', 'user2');

      // Listen for incoming request on target socket
      const incomingRequestPromise = waitForEvent<ChatIncomingRequestPayload>(
        socket2,
        ServerEvent.CHAT_INCOMING_REQUEST
      );

      // Listen for request result on initiator socket
      const requestResultPromise = waitForEvent<ChatRequestResultPayload>(
        socket1,
        ServerEvent.CHAT_REQUEST_RESULT
      );

      // Send chat request
      socket1.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '102' });

      const [incomingRequest, requestResult] = await Promise.all([
        incomingRequestPromise,
        requestResultPromise,
      ]);

      expect(requestResult.success).toBe(true);
      expect(requestResult.targetName).toBe('user2');
      expect(incomingRequest.from).toBe('101');
      expect(incomingRequest.fromName).toBe('user1');
    });

    it('should fail when target user does not exist', async () => {
      const socket = createSocket();
      await connectSocket(socket);
      await registerUser(socket, '103', 'user1');

      const resultPromise = waitForEvent<ChatRequestResultPayload>(
        socket,
        ServerEvent.CHAT_REQUEST_RESULT
      );

      socket.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '999' });

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when user trying to chat with self', async () => {
      const socket = createSocket();
      await connectSocket(socket);
      await registerUser(socket, '104', 'user1');

      const resultPromise = waitForEvent<ChatRequestResultPayload>(
        socket,
        ServerEvent.CHAT_REQUEST_RESULT
      );

      socket.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '104' });

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('yourself');
    });

    it('should indicate when target user is busy', async () => {
      const socket1 = createSocket();
      const socket2 = createSocket();
      const socket3 = createSocket();
      await connectSocket(socket1);
      await connectSocket(socket2);
      await connectSocket(socket3);

      await registerUser(socket1, '105', 'user1');
      await registerUser(socket2, '106', 'user2');
      await registerUser(socket3, '107', 'user3');

      // user1 requests to chat with user2
      const incomingPromise = waitForEvent<ChatIncomingRequestPayload>(
        socket2,
        ServerEvent.CHAT_INCOMING_REQUEST
      );
      socket1.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '106' });
      await incomingPromise;

      // user2 accepts
      const chatStartedPromise1 = waitForEvent<ChatStartedPayload>(
        socket1,
        ServerEvent.CHAT_STARTED
      );
      const chatStartedPromise2 = waitForEvent<ChatStartedPayload>(
        socket2,
        ServerEvent.CHAT_STARTED
      );
      socket2.emit(ClientEvent.CHAT_RESPONSE, { fromConnectionId: '105', accepted: true });
      await Promise.all([chatStartedPromise1, chatStartedPromise2]);

      // user3 tries to chat with user2
      const resultPromise = waitForEvent<ChatRequestResultPayload>(
        socket3,
        ServerEvent.CHAT_REQUEST_RESULT
      );
      socket3.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '106' });
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.isBusy).toBe(true);
      expect(result.targetName).toBe('user2');
    });
  });

  describe('CHAT_MESSAGE event', () => {
    it('should deliver message to chat partner', async () => {
      const socket1 = createSocket();
      const socket2 = createSocket();
      await connectSocket(socket1);
      await connectSocket(socket2);

      await registerUser(socket1, '201', 'alice');
      await registerUser(socket2, '202', 'bob');

      // Establish chat session
      const incomingPromise = waitForEvent<ChatIncomingRequestPayload>(
        socket2,
        ServerEvent.CHAT_INCOMING_REQUEST
      );
      socket1.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '202' });
      await incomingPromise;

      const chatStartedPromise1 = waitForEvent<ChatStartedPayload>(
        socket1,
        ServerEvent.CHAT_STARTED
      );
      const chatStartedPromise2 = waitForEvent<ChatStartedPayload>(
        socket2,
        ServerEvent.CHAT_STARTED
      );
      socket2.emit(ClientEvent.CHAT_RESPONSE, { fromConnectionId: '201', accepted: true });
      await Promise.all([chatStartedPromise1, chatStartedPromise2]);

      // Send message from alice to bob
      const messagePromise1 = waitForEvent<ChatMessageReceivedPayload>(
        socket1,
        ServerEvent.CHAT_MESSAGE_RECEIVED
      );
      const messagePromise2 = waitForEvent<ChatMessageReceivedPayload>(
        socket2,
        ServerEvent.CHAT_MESSAGE_RECEIVED
      );

      socket1.emit(ClientEvent.CHAT_MESSAGE, { message: 'Hello bob!' });

      const [senderMessage, receiverMessage] = await Promise.all([
        messagePromise1,
        messagePromise2,
      ]);

      // Both should receive the message
      expect(senderMessage.content).toBe('Hello bob!');
      expect(senderMessage.from).toBe('201');
      expect(senderMessage.fromName).toBe('alice');
      expect(senderMessage.id).toBeDefined();
      expect(senderMessage.timestamp).toBeDefined();

      expect(receiverMessage.content).toBe('Hello bob!');
      expect(receiverMessage.from).toBe('201');
    });

    it('should allow bidirectional messaging', async () => {
      const socket1 = createSocket();
      const socket2 = createSocket();
      await connectSocket(socket1);
      await connectSocket(socket2);

      await registerUser(socket1, '203', 'alice');
      await registerUser(socket2, '204', 'bob');

      // Establish chat
      const incomingPromise = waitForEvent<ChatIncomingRequestPayload>(
        socket2,
        ServerEvent.CHAT_INCOMING_REQUEST
      );
      socket1.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '204' });
      await incomingPromise;

      const chatStartedPromise1 = waitForEvent<ChatStartedPayload>(
        socket1,
        ServerEvent.CHAT_STARTED
      );
      const chatStartedPromise2 = waitForEvent<ChatStartedPayload>(
        socket2,
        ServerEvent.CHAT_STARTED
      );
      socket2.emit(ClientEvent.CHAT_RESPONSE, { fromConnectionId: '203', accepted: true });
      await Promise.all([chatStartedPromise1, chatStartedPromise2]);

      // bob sends message back to alice
      const messagePromise = waitForEvent<ChatMessageReceivedPayload>(
        socket1,
        ServerEvent.CHAT_MESSAGE_RECEIVED
      );

      socket2.emit(ClientEvent.CHAT_MESSAGE, { message: 'Hey alice!' });

      const message = await messagePromise;

      expect(message.content).toBe('Hey alice!');
      expect(message.from).toBe('204');
      expect(message.fromName).toBe('bob');
    });

    it('should not deliver message when not in chat', async () => {
      const socket = createSocket();
      await connectSocket(socket);
      await registerUser(socket, '205', 'alice');

      // Set up a listener that should NOT receive any messages
      let messageReceived = false;
      socket.on(ServerEvent.CHAT_MESSAGE_RECEIVED, () => {
        messageReceived = true;
      });

      socket.emit(ClientEvent.CHAT_MESSAGE, { message: 'Hello?' });

      // Wait briefly to ensure no message is received
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(messageReceived).toBe(false);
    });
  });

  describe('CHAT_LEAVE event', () => {
    it('should notify partner when user leaves chat', async () => {
      const socket1 = createSocket();
      const socket2 = createSocket();
      await connectSocket(socket1);
      await connectSocket(socket2);

      await registerUser(socket1, '301', 'alice');
      await registerUser(socket2, '302', 'bob');

      // Establish chat session
      const incomingPromise = waitForEvent<ChatIncomingRequestPayload>(
        socket2,
        ServerEvent.CHAT_INCOMING_REQUEST
      );
      socket1.emit(ClientEvent.CHAT_REQUEST, { targetConnectionId: '302' });
      await incomingPromise;

      const chatStartedPromise1 = waitForEvent<ChatStartedPayload>(
        socket1,
        ServerEvent.CHAT_STARTED
      );
      const chatStartedPromise2 = waitForEvent<ChatStartedPayload>(
        socket2,
        ServerEvent.CHAT_STARTED
      );
      socket2.emit(ClientEvent.CHAT_RESPONSE, { fromConnectionId: '301', accepted: true });
      await Promise.all([chatStartedPromise1, chatStartedPromise2]);

      // alice leaves the chat
      const chatEndedPromise = waitForEvent<ChatEndedPayload>(socket2, ServerEvent.CHAT_ENDED);

      socket1.emit(ClientEvent.CHAT_LEAVE);

      const chatEnded = await chatEndedPromise;

      expect(chatEnded.reason).toBe('partner_left');
      expect(chatEnded.message).toContain('alice');
    });
  });
});
