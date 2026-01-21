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
  UserRegisteredPayload,
} from '@wave-chat/shared';
import { StoredUser } from '../types';
import { saveUser, getUser, removeUser } from '../utils/localStorage';
import { api } from '../services/api';

type UserContextValue = {
  user: StoredUser | null;
  isRegistered: boolean;
  isConnected: boolean;
  isRegistering: boolean;
  registrationError: string | null;
  register: (connectionId: string, name: string) => Promise<boolean>;
  generateConnectionId: () => Promise<string | null>;
  validateConnectionId: (connectionId: string) => Promise<{ valid: boolean; available?: boolean } | null>;
};

const UserContext = createContext<UserContextValue | null>(null);

type UserProviderProps = {
  children: ReactNode;
  socket: Socket;
};

export const UserProvider = ({ children, socket }: UserProviderProps): ReactElement => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const isRegistered = user !== null;

  useEffect(() => {
    const handleConnect = (): void => {
      setIsConnected(true);

      const savedUser = getUser();
      if (savedUser) {
        socket.emit(ClientEvent.USER_REGISTER, {
          connectionId: savedUser.connectionId,
          name: savedUser.name,
        });
      }
    };

    const handleDisconnect = (_reason: string): void => {
      setIsConnected(false);
    };

    const handleConnectError = (_error: Error): void => {
      setIsConnected(false);
    };

    const handleRegistered = (payload: UserRegisteredPayload): void => {
      setIsRegistering(false);

      if (payload.success) {
        const savedUser = getUser();
        if (savedUser) {
          setUser(savedUser);
        }
        setRegistrationError(null);
      } else {
        setRegistrationError(payload.error || 'Registration failed');
        if (!payload.error?.includes('another tab')) {
          removeUser();
          setUser(null);
        }
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(ServerEvent.USER_REGISTERED, handleRegistered);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(ServerEvent.USER_REGISTERED, handleRegistered);
    };
  }, [socket]);

  useEffect(() => {
    const savedUser = getUser();
    if (savedUser && socket.connected) {
      setUser(savedUser);
    }
  }, [socket]);


  const register = useCallback(
    async (connectionId: string, name: string): Promise<boolean> => {
      setIsRegistering(true);
      setRegistrationError(null);

      const validationResult = await api.validateRegistration(connectionId, name);

      if (!validationResult.success) {
        setIsRegistering(false);
        setRegistrationError(validationResult.error || 'Validation failed');
        return false;
      }

      const newUser: StoredUser = { connectionId, name };
      saveUser(newUser);

      socket.emit(ClientEvent.USER_REGISTER, { connectionId, name });

      return true;
    },
    [socket]
  );

  const generateConnectionId = useCallback(async (): Promise<string | null> => {
    const result = await api.generateConnectionId();
    if (result.success && result.data) {
      return result.data.connectionId;
    }
    return null;
  }, []);

  const validateConnectionId = useCallback(
    async (connectionId: string): Promise<{ valid: boolean; available?: boolean } | null> => {
      const result = await api.validateConnectionId(connectionId);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    },
    []
  );


  const value: UserContextValue = {
    user,
    isRegistered,
    isConnected,
    isRegistering,
    registrationError,
    register,
    generateConnectionId,
    validateConnectionId,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
