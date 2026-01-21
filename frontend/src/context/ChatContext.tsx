import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
} from 'react';
import { Socket } from 'socket.io-client';
import {
  ClientEvent,
  ServerEvent,
  ChatIncomingRequestPayload,
  ChatRequestResultPayload,
  ChatRequestCancelledPayload,
  ChatStartedPayload,
  ChatMessageReceivedPayload,
} from '@wave-chat/shared';
import { ChatMessage, ChatSession, IncomingChatRequest } from '../types';
import {
  getChatHistory,
  addMessageToHistory,
  saveChatHistory,
} from '../utils/localStorage';
import { useUser } from './UserContext';
import { INFO_MESSAGES } from '../constants/messages';

// ─── Context Types ───

type ChatContextValue = {
  session: ChatSession | null;
  messages: ChatMessage[];
  incomingRequest: IncomingChatRequest | null;
  pendingRequest: { targetId: string; targetName?: string } | null;
  requestError: string | null;
  busyUser: { connectionId: string; name: string } | null;
  sendChatRequest: (targetConnectionId: string) => void;
  respondToRequest: (fromConnectionId: string, accepted: boolean) => void;
  sendMessage: (message: string) => void;
  leaveChat: () => void;
  clearBusyUser: () => void;
  clearRequestError: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider Props ───

type ChatProviderProps = {
  children: ReactNode;
  socket: Socket;
};

// ─── Provider Component ───

export const ChatProvider = ({ children, socket }: ChatProviderProps): ReactElement => {
  const { user } = useUser();

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<IncomingChatRequest | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{ targetId: string; targetName?: string } | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [busyUser, setBusyUser] = useState<{ connectionId: string; name: string } | null>(null);

  // ─── Socket Event Handlers ───

  useEffect(() => {
    const handleIncomingRequest = (payload: ChatIncomingRequestPayload): void => {
      setIncomingRequest({
        from: payload.from,
        fromName: payload.fromName,
      });
    };

    const handleRequestResult = (payload: ChatRequestResultPayload): void => {
      if (payload.success) {
        setPendingRequest((prev) =>
          prev ? { ...prev, targetName: payload.targetName } : null
        );
        setRequestError(null);
      } else {
        setPendingRequest(null);

        if (payload.isBusy && payload.targetName) {
          setBusyUser({
            connectionId: pendingRequest?.targetId || '',
            name: payload.targetName,
          });
        } else {
          setRequestError(payload.error || 'Chat request failed');
        }
      }
    };

    const handleChatStarted = (payload: ChatStartedPayload): void => {
      setPendingRequest(null);
      setIncomingRequest(null);
      setRequestError(null);
      setBusyUser(null);

      const newSession: ChatSession = {
        sessionId: payload.sessionId,
        partner: {
          connectionId: payload.partnerId,
          name: payload.partnerName,
        },
        isInitiator: payload.isInitiator,
        startedAt: new Date().toISOString(),
      };

      setSession(newSession);

      if (user) {
        const history = getChatHistory(user.connectionId, payload.partnerId);
        setMessages(history);

        if (!payload.isInitiator && history.length === 0) {
          setTimeout(() => {
            socket.emit(ClientEvent.CHAT_MESSAGE, {
              message: INFO_MESSAGES.AUTO_GREETING,
            });
          }, 500);
        }
      }
    };

    const handleMessageReceived = (payload: ChatMessageReceivedPayload): void => {
      if (!user) return;

      const newMessage: ChatMessage = {
        id: payload.id,
        from: payload.from,
        fromName: payload.fromName,
        content: payload.content,
        timestamp: payload.timestamp,
        isOwn: payload.from === user.connectionId,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      if (session) {
        addMessageToHistory(user.connectionId, session.partner.connectionId, newMessage);
      }
    };

    const handleChatEnded = (): void => {
      setSession(null);
      setMessages([]);
    };

    const handleRequestCancelled = (payload: ChatRequestCancelledPayload): void => {
      // Clear the incoming request if it was from the user who cancelled
      setIncomingRequest((prev) => {
        if (prev && prev.from === payload.from) {
          return null;
        }
        return prev;
      });
    };

    socket.on(ServerEvent.CHAT_INCOMING_REQUEST, handleIncomingRequest);
    socket.on(ServerEvent.CHAT_REQUEST_RESULT, handleRequestResult);
    socket.on(ServerEvent.CHAT_REQUEST_CANCELLED, handleRequestCancelled);
    socket.on(ServerEvent.CHAT_STARTED, handleChatStarted);
    socket.on(ServerEvent.CHAT_MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(ServerEvent.CHAT_ENDED, handleChatEnded);

    return () => {
      socket.off(ServerEvent.CHAT_INCOMING_REQUEST, handleIncomingRequest);
      socket.off(ServerEvent.CHAT_REQUEST_RESULT, handleRequestResult);
      socket.off(ServerEvent.CHAT_REQUEST_CANCELLED, handleRequestCancelled);
      socket.off(ServerEvent.CHAT_STARTED, handleChatStarted);
      socket.off(ServerEvent.CHAT_MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(ServerEvent.CHAT_ENDED, handleChatEnded);
    };
  }, [socket, user, session, pendingRequest]);

  // ─── Save Messages on Update ───

  useEffect(() => {
    if (session && user && messages.length > 0) {
      saveChatHistory(user.connectionId, session.partner.connectionId, messages);
    }
  }, [messages, session, user]);

  // ─── Actions ───

  const sendChatRequest = useCallback(
    (targetConnectionId: string): void => {
      setPendingRequest({ targetId: targetConnectionId });
      setRequestError(null);

      socket.emit(ClientEvent.CHAT_REQUEST, {
        targetConnectionId,
      });
    },
    [socket]
  );

  const respondToRequest = useCallback(
    (fromConnectionId: string, accepted: boolean): void => {
      setIncomingRequest(null);

      socket.emit(ClientEvent.CHAT_RESPONSE, {
        fromConnectionId,
        accepted,
      });
    },
    [socket]
  );

  const sendMessage = useCallback(
    (message: string): void => {
      if (!session || !message.trim()) return;

      socket.emit(ClientEvent.CHAT_MESSAGE, {
        message: message.trim(),
      });
    },
    [socket, session]
  );

  const leaveChat = useCallback((): void => {
    if (!session) return;

    socket.emit(ClientEvent.CHAT_LEAVE, {});

    setSession(null);
    setMessages([]);
  }, [socket, session]);

  const clearBusyUser = useCallback((): void => {
    setBusyUser(null);
  }, []);

  const clearRequestError = useCallback((): void => {
    setRequestError(null);
  }, []);

  // ─── Context Value ───

  const value: ChatContextValue = {
    session,
    messages,
    incomingRequest,
    pendingRequest,
    requestError,
    busyUser,
    sendChatRequest,
    respondToRequest,
    sendMessage,
    leaveChat,
    clearBusyUser,
    clearRequestError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// ─── Hook ───

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
