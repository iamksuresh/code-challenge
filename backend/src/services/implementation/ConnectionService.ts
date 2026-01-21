import { Logger } from 'winston';
import { UserStatus } from '@wave-chat/shared';
import { IConnectionService } from '../IConnectionService';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IChatService } from '../IChatService';
import {
  ApiResponse,
  GenerateConnectionIdResponse,
  ValidateConnectionIdResponse,
} from '../../types';
import { connectionIdSchema, nameSchema } from '../../schemas/validation';

export class ConnectionService implements IConnectionService {
  private chatService: IChatService | null = null;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Check if user is currently online in another tab/session
   */
  private isUserOnlineInAnotherTab = (user: { socketId: string | null; status: UserStatus }): boolean => {
    return Boolean(user.socketId && user.status !== UserStatus.OFFLINE);
  };

  setChatService = (chatService: IChatService): void => {
    this.chatService = chatService;
  };

  generateConnectionId = (): ApiResponse<GenerateConnectionIdResponse> => {
    // for optimisation, Generate 3 for random 3-digit numbers and find one that's not registered
    // for POC only. In production, we should use uuid's

    const candidates = Array.from({ length: 3 }, () => {
      const num = Math.floor(Math.random() * 1000);
      return num.toString().padStart(3, '0');
    });

    const connectionId = candidates.find(
      (id) => this.userRepository.findByConnectionId(id) === undefined
    );

    if (!connectionId) {
      this.logger.error('All generated connection IDs are taken');
      return {
        success: false,
        error: 'Unable to generate unique connection ID. Please try again.',
      };
    }

    this.logger.info('Generated connection ID', { connectionId });
    return {
      success: true,
      data: { connectionId },
    };
  };

  validateConnectionId = (connectionId: string): ApiResponse<ValidateConnectionIdResponse> => {
    // Validate format
    const parseResult = connectionIdSchema.safeParse(connectionId);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0].message,
      };
    }

    // check user availability
    const user = this.userRepository.findByConnectionId(connectionId);
    const isAvailable = !user || user.status === UserStatus.OFFLINE;

    return {
      success: true,
      data: {
        valid: true,
        available: isAvailable,
      },
    };
  };

  registerUser = (
    connectionId: string,
    name: string,
    socketId: string
  ): ApiResponse<{ suggestedConnectionId?: string }> => {
    // Validate inputs
    const idResult = connectionIdSchema.safeParse(connectionId);
    if (!idResult.success) {
      return { success: false, error: idResult.error.errors[0].message };
    }

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      return { success: false, error: nameResult.error.errors[0].message };
    }

    const trimmedName = name.trim();
    const existingUser = this.userRepository.findByConnectionId(connectionId);

    if (existingUser) {
      // Check if user is already online (multi-tab detection)
      if (this.isUserOnlineInAnotherTab(existingUser)) {
        this.logger.warn('Multi-tab registration attempt', { connectionId });
        return {
          success: false,
          error: 'Wave Chat is already open in another tab',
        };
      }

      // User exists but offline - this is a reconnection
      this.userRepository.updateSocketId(connectionId, socketId);
      this.userRepository.updateStatus(connectionId, UserStatus.ONLINE);
      this.logger.info('User reconnected', { connectionId, name: existingUser.name });

      return { success: true };
    }

    // New user registration
    this.userRepository.create({
      connectionId,
      name: trimmedName,
      socketId,
      status: UserStatus.ONLINE,
      chattingWith: null,
      registeredAt: new Date(),
    });

    this.logger.info('New user registered', { connectionId, name: trimmedName });
    return { success: true };
  };

  handleReconnection = (connectionId: string, socketId: string): ApiResponse => {
    const user = this.userRepository.findByConnectionId(connectionId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check for multi-tab
    if (this.isUserOnlineInAnotherTab(user)) {
      return {
        success: false,
        error: 'Wave Chat is already open in another tab',
      };
    }

    this.userRepository.updateSocketId(connectionId, socketId);
    this.userRepository.updateStatus(connectionId, UserStatus.ONLINE);

    this.logger.info('User reconnected', { connectionId });
    return { success: true };
  };

  handleDisconnection = (socketId: string): void => {
    const user = this.userRepository.findBySocketId(socketId);

    if (!user) {
      this.logger.debug('Disconnect: No user found for socket', { socketId });
      return;
    }

    this.logger.info('User disconnected', {
      connectionId: user.connectionId,
      name: user.name,
      wasInChat: user.status === UserStatus.IN_CHAT,
    });

    // Cleanup pending chat requests (both incoming and outgoing)
    if (this.chatService) {
      this.chatService.cleanupPendingRequests(user.connectionId);
    }

    // If user was in chat, notify partner and end chat
    if (user.chattingWith && this.chatService) {
      this.chatService.handlePartnerDisconnected(user.connectionId, user.chattingWith);
    }

    this.userRepository.updateStatus(user.connectionId, UserStatus.OFFLINE);
    this.userRepository.updateSocketId(user.connectionId, null);
    this.userRepository.updateChattingWith(user.connectionId, null);
  };
}
