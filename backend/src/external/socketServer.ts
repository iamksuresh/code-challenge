import { Server as IOServer, Socket } from 'socket.io';
import { Logger } from 'winston';
import {
  ClientEvent,
  ServerEvent,
  UserRegisterPayload,
  ChatRequestPayload,
  ChatResponsePayload,
  ChatMessagePayload,
} from '@wave-chat/shared';
import { IConnectionService } from '../services/IConnectionService';
import { IChatService } from '../services/IChatService';

export const setupSocketServer = (
  io: IOServer,
  connectionService: IConnectionService,
  chatService: IChatService,
  logger: Logger
): void => {
  io.on('connection', (socket: Socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    socket.on(ClientEvent.USER_REGISTER, (payload: UserRegisterPayload) => {
      logger.info('User register event', {
        socketId: socket.id,
        connectionId: payload.connectionId,
        name: payload.name,
      });

      // Try reconnection first, if user not found and name provided, register new user
      let result = connectionService.handleReconnection(payload.connectionId, socket.id);

      if (!result.success && result.error === 'User not found' && payload.name) {
        result = connectionService.registerUser(payload.connectionId, payload.name, socket.id);
      }

      socket.emit(ServerEvent.USER_REGISTERED, {
        success: result.success,
        error: result.error,
      });
    });

    socket.on(ClientEvent.CHAT_REQUEST, (payload: ChatRequestPayload) => {
      logger.info('Chat request event', {
        socketId: socket.id,
        targetConnectionId: payload.targetConnectionId,
      });

      chatService.handleChatRequest(socket.id, payload.targetConnectionId);
    });

    socket.on(ClientEvent.CHAT_RESPONSE, (payload: ChatResponsePayload) => {
      logger.info('Chat response event', {
        socketId: socket.id,
        fromConnectionId: payload.fromConnectionId,
        accepted: payload.accepted,
      });

      chatService.handleChatResponse(socket.id, payload.fromConnectionId, payload.accepted);
    });

    socket.on(ClientEvent.CHAT_MESSAGE, (payload: ChatMessagePayload) => {
      logger.debug('Chat message event', {
        socketId: socket.id,
      });

      chatService.handleChatMessage(socket.id, payload.message);
    });

    socket.on(ClientEvent.CHAT_LEAVE, () => {
      logger.info('Chat leave event', { socketId: socket.id });

      chatService.handleChatLeave(socket.id);
    });

    socket.on('disconnect', (reason: string) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason });

      connectionService.handleDisconnection(socket.id);
    });
  });

  logger.info('Socket server initialized');
};
