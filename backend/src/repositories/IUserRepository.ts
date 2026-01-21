import { User } from '../types';
import { UserStatus } from '@wave-chat/shared';

export interface IUserRepository {
  create(user: User): void;
  updateStatus(connectionId: string, status: UserStatus): boolean;
  updateSocketId(connectionId: string, socketId: string | null): boolean;
  updateChattingWith(connectionId: string, partnerId: string | null): boolean;
  findByConnectionId(connectionId: string): User | undefined;
  findBySocketId(socketId: string): User | undefined;
}
