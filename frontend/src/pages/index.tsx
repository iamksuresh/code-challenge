import { useEffect, type ReactNode, type ReactElement } from 'react';
import {
  BrowserRouter,
  Routes as RouterRoutes,
  Route,
  useNavigate,
} from 'react-router';
import { io, Socket } from 'socket.io-client';
import { ConfigProvider } from 'antd';

import { config } from '../config';
import { appTheme } from '../themes';
import { UserProvider } from '../context/UserContext';
import { ChatProvider, useChat } from '../context/ChatContext';

import { Chat } from './Chat';
import { Home } from './Home';

// ─── Socket Configuration ───
const socket: Socket = io(config.SOCKET_ENDPOINT, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// ─── Navigation Handler Component ───

type NavigationHandlerProps = {
  children: ReactNode;
};

const NavigationHandler = ({ children }: NavigationHandlerProps): ReactElement => {
  const navigate = useNavigate();
  const { session } = useChat();

  useEffect(() => {
    if (session) {
      navigate(`/chat/${session.partner.connectionId}`, { replace: true });
    }
  }, [session, navigate]);

  return <>{children}</>;
};

// ─── App Routes ───

const AppRoutes = (): ReactElement => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/chat/:userId" element={<Chat />} />
    </RouterRoutes>
  );
};

// ─── Main Routes Component ───

export const Routes = (): ReactElement => {
  return (
    <ConfigProvider theme={appTheme}>
      <BrowserRouter>
        <UserProvider socket={socket}>
          <ChatProvider socket={socket}>
            <NavigationHandler>
              <AppRoutes />
            </NavigationHandler>
          </ChatProvider>
        </UserProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default Routes;
