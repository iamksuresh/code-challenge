import express, { Express } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { createContainer } from '../src/container';
import { createConnectionRoutes } from '../src/routes/connectionRoutes';
import { setupSocketServer } from '../src/external/socketServer';
import { Container } from '../src/types';

export interface TestServer {
  app: Express;
  httpServer: http.Server;
  io: IOServer;
  container: Container;
  getAddress: () => string;
  close: () => Promise<void>;
}

export const createTestServer = (): TestServer => {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new IOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware
  app.use(express.json());

  // Initialize DI container
  const container = createContainer(io);

  // Setup routes
  app.use('/chat', createConnectionRoutes(container.connectionService));

  // Setup WebSocket handlers
  setupSocketServer(io, container.connectionService, container.chatService, container.logger);

  const getAddress = (): string => {
    const addr = httpServer.address();
    if (typeof addr === 'string') {
      return addr;
    }
    return `http://localhost:${addr?.port}`;
  };

  const close = (): Promise<void> => {
    return new Promise((resolve) => {
      // Close all socket connections first
      io.disconnectSockets(true);

      // Close the socket.io server
      io.close((err) => {
        if (err) {
          resolve();
          return;
        }

        // Close the HTTP server
        httpServer.close((httpErr) => {
          resolve();
        });
      });
    });
  };

  return {
    app,
    httpServer,
    io,
    container,
    getAddress,
    close,
  };
};

/**
 * Helper to wait for a socket event with timeout
 */
export const waitForEvent = <T>(
  socket: { once: (event: string, callback: (data: T) => void) => void },
  event: string,
  timeoutMs: number = 5000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeoutMs);

    socket.once(event, (data: T) => {
      clearTimeout(timeout);
      resolve(data);
    });
  });
};

/**
 * Helper to start server and return address
 */
export const startServer = (server: TestServer): Promise<string> => {
  return new Promise((resolve) => {
    server.httpServer.listen(0, () => {
      resolve(server.getAddress());
    });
  });
};
