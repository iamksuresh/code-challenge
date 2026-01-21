import { UserStatus } from '@wave-chat/shared';

export type User = {
  connectionId: string;
  name: string;
  socketId: string | null;
  status: UserStatus;
  chattingWith: string | null;
  registeredAt: Date;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type GenerateConnectionIdResponse = {
  connectionId: string;
};

export type ValidateConnectionIdResponse = {
  valid: boolean;
  available?: boolean;
};

export type Container = {
  logger: import('winston').Logger;
  userRepository: import('../repositories/IUserRepository').IUserRepository;
  connectionService: import('../services/IConnectionService').IConnectionService;
  chatService: import('../services/IChatService').IChatService;
};
