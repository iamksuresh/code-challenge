import { Server as IOServer } from 'socket.io';
import { createLogger } from './external/logger';
import { InMemoryUserRepository } from './repositories/implementation/InMemoryUserRepository';
import { ConnectionService } from './services/implementation/ConnectionService';
import { ChatService } from './services/implementation/ChatService';
import { Container } from './types';

export const createContainer = (io: IOServer): Container => {
  const logger = createLogger();

  const userRepository = new InMemoryUserRepository(logger);

  const connectionService = new ConnectionService(userRepository, logger);
  const chatService = new ChatService(userRepository, io, logger);

  connectionService.setChatService(chatService);

  logger.info('DI Container initialized');

  return {
    logger,
    userRepository,
    connectionService,
    chatService,
  };
};
