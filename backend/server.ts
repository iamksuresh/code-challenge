import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as IOServer } from 'socket.io';

import CONFIG from './config';
import { createContainer } from './src/container';
import { createConnectionRoutes } from './src/routes/connectionRoutes';
import { setupSocketServer } from './src/external/socketServer';

// Create Express app
const app = express();

const WEBSOCKET_TRANSPORT = 'websocket';
const POLLING_TRANSPORT = 'polling';

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: CONFIG.CORS_ORIGIN,
    credentials: true,
  })
);

// Create HTTP server
const httpServer = http.createServer(app);

// Create Socket.io server
const io = new IOServer(httpServer, {
  cors: {
    origin: CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: [WEBSOCKET_TRANSPORT, POLLING_TRANSPORT],
});

// Initialize DI container
const container = createContainer(io);

// Setup routes
app.use('/chat', createConnectionRoutes(container.connectionService));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket handlers
setupSocketServer(io, container.connectionService, container.chatService, container.logger);

// Start server
httpServer.listen(CONFIG.PORT, () => {
  container.logger.info(`Server listening on port ${CONFIG.PORT}`);
});

// shutdown
process.on('SIGTERM', () => {
  httpServer.close(() => {
    container.logger.info('Server closed');
    process.exit(0);
  });
});
