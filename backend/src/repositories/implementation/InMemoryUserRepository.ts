import { Logger } from 'winston';
import { User } from '../../types';
import { UserStatus } from '@wave-chat/shared';
import { IUserRepository } from '../IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  // not using db but saving in map - for POC only
  private users: Map<string, User> = new Map();
  private socketToConnection: Map<string, string> = new Map();

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  create = (user: User): void => {
    this.users.set(user.connectionId, { ...user });
    if (user.socketId) {
      this.socketToConnection.set(user.socketId, user.connectionId);
    }
    this.logger.info('User created', {
      connectionId: user.connectionId,
      name: user.name,
    });
  };

  updateStatus = (connectionId: string, status: UserStatus): boolean => {
    const user = this.users.get(connectionId);
    if (!user) return false;

    const updatedUser: User = { ...user, status };
    this.users.set(connectionId, updatedUser);
    this.logger.info('User status updated', { connectionId, status });
    return true;
  };

  updateSocketId = (connectionId: string, socketId: string | null): boolean => {
    const user = this.users.get(connectionId);
    if (!user) return false;

    if (user.socketId) {
      this.socketToConnection.delete(user.socketId);
    }

    const updatedUser: User = { ...user, socketId };
    this.users.set(connectionId, updatedUser);

    if (socketId) {
      this.socketToConnection.set(socketId, connectionId);
    }

    this.logger.info('User socketId updated', { connectionId, socketId });
    return true;
  };

  updateChattingWith = (connectionId: string, partnerId: string | null): boolean => {
    const user = this.users.get(connectionId);
    if (!user) return false;

    const updatedUser: User = { ...user, chattingWith: partnerId };
    this.users.set(connectionId, updatedUser);
    this.logger.info('User chattingWith updated', { connectionId, partnerId });
    return true;
  };

  findByConnectionId = (connectionId: string): User | undefined => {
    return this.users.get(connectionId);
  };

  findBySocketId = (socketId: string): User | undefined => {
    const connectionId = this.socketToConnection.get(socketId);
    if (!connectionId) return undefined;
    return this.users.get(connectionId);
  };
}
