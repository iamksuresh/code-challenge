import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Server as IOServer } from 'socket.io';
import {
  ServerEvent,
  ChatEndReason,
  UserStatus,
  ServerPayloadMap,
} from '@wave-chat/shared';
import { IChatService } from '../IChatService';
import { IUserRepository } from '../../repositories/IUserRepository';
import { chatMessageSchema } from '../../schemas/validation';

export class ChatService implements IChatService {
  private pendingRequests: Map<string, string> = new Map();

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly io: IOServer,
    private readonly logger: Logger
  ) {}

  handleChatRequest = (initiatorSocketId: string, targetConnectionId: string): void => {
    const initiator = this.userRepository.findBySocketId(initiatorSocketId);

    if (!initiator) {
      this.emitToSocket(initiatorSocketId, ServerEvent.CHAT_REQUEST_RESULT, {
        success: false,
        error: 'You are not registered',
      });
      return;
    }

    const target = this.userRepository.findByConnectionId(targetConnectionId);

    if (!target) {
      this.emitToSocket(initiatorSocketId, ServerEvent.CHAT_REQUEST_RESULT, {
        success: false,
        error: `User ${targetConnectionId} not found`,
      });
      return;
    }

    if (target.status === UserStatus.OFFLINE || !target.socketId) {
      this.emitToSocket(initiatorSocketId, ServerEvent.CHAT_REQUEST_RESULT, {
        success: false,
        error: `User ${targetConnectionId} is offline`,
      });
      return;
    }

    if (target.connectionId === initiator.connectionId) {
      this.emitToSocket(initiatorSocketId, ServerEvent.CHAT_REQUEST_RESULT, {
        success: false,
        error: 'You cannot chat with yourself',
      });
      return;
    }

    // Check if target is busy (in chat)
    if (target.status === UserStatus.IN_CHAT) {
      this.emitToSocket(initiatorSocketId, ServerEvent.CHAT_REQUEST_RESULT, {
        success: false,
        isBusy: true,
        targetName: target.name,
        error: `${target.name} is currently in another chat`,
      });
      return;
    }

    // Store pending request
    this.pendingRequests.set(target.connectionId, initiator.connectionId);

    this.logger.info('Chat request sent', {
      from: initiator.connectionId,
      to: target.connectionId,
    });

    // Notify target of incoming request
    this.emitToSocket(target.socketId, ServerEvent.CHAT_INCOMING_REQUEST, {
      from: initiator.connectionId,
      fromName: initiator.name,
    });

    this.emitToSocket(initiatorSocketId, ServerEvent.CHAT_REQUEST_RESULT, {
      success: true,
      targetName: target.name,
    });
  };

  handleChatResponse = (
    responderSocketId: string,
    fromConnectionId: string,
    accepted: boolean
  ): void => {
    const responder = this.userRepository.findBySocketId(responderSocketId);

    if (!responder) {
      this.logger.warn('Chat response from unregistered socket', { responderSocketId });
      return;
    }

    // Verify there was a pending request
    const pendingInitiatorId = this.pendingRequests.get(responder.connectionId);
    if (pendingInitiatorId !== fromConnectionId) {
      this.logger.warn('Invalid chat response - no matching pending request', {
        responder: responder.connectionId,
        fromConnectionId,
      });
      return;
    }

    // Clear pending request
    this.pendingRequests.delete(responder.connectionId);

    const initiator = this.userRepository.findByConnectionId(fromConnectionId);
    if (!initiator || !initiator.socketId) {
      this.logger.warn('Initiator no longer available', { fromConnectionId });
      return;
    }

    this.logger.info('Chat response received', {
      from: responder.connectionId,
      to: initiator.connectionId,
      accepted,
    });

    if (!accepted) {
      // Notify initiator of decline
      this.emitToSocket(initiator.socketId, ServerEvent.CHAT_REQUEST_RESULT, {
        success: false,
        error: `${responder.name} declined your chat request`,
      });
      return;
    }

    this.startChat(initiator.connectionId, responder.connectionId);
  };

  private startChat = (initiatorId: string, acceptorId: string): void => {
    const initiator = this.userRepository.findByConnectionId(initiatorId);
    const acceptor = this.userRepository.findByConnectionId(acceptorId);

    if (!initiator?.socketId || !acceptor?.socketId) {
      this.logger.error('Cannot start chat - users not available', {
        initiatorId,
        acceptorId,
      });
      return;
    }

    const sessionId = uuidv4();

    // Cancel any pending requests where either participant was the initiator
    this.cancelPendingRequestsFromUser(initiatorId);
    this.cancelPendingRequestsFromUser(acceptorId);

    // Update both users' status
    this.userRepository.updateStatus(initiatorId, UserStatus.IN_CHAT);
    this.userRepository.updateStatus(acceptorId, UserStatus.IN_CHAT);
    this.userRepository.updateChattingWith(initiatorId, acceptorId);
    this.userRepository.updateChattingWith(acceptorId, initiatorId);

    this.logger.info('Chat started', {
      sessionId,
      initiator: initiatorId,
      acceptor: acceptorId,
    });

    // Notify both users
    this.emitToSocket(initiator.socketId, ServerEvent.CHAT_STARTED, {
      sessionId,
      partnerId: acceptorId,
      partnerName: acceptor.name,
      isInitiator: true,
    });

    this.emitToSocket(acceptor.socketId, ServerEvent.CHAT_STARTED, {
      sessionId,
      partnerId: initiatorId,
      partnerName: initiator.name,
      isInitiator: false,
    });
  };

  private cancelPendingRequestsFromUser = (initiatorId: string): void => {
    // Find all pending requests where this user was the initiator
    // pendingRequests: Map<targetConnectionId, initiatorConnectionId>
    const targetsToCancel: string[] = [];

    this.pendingRequests.forEach((pendingInitiatorId, targetId) => {
      if (pendingInitiatorId === initiatorId) {
        targetsToCancel.push(targetId);
      }
    });

    for (const targetId of targetsToCancel) {
      this.pendingRequests.delete(targetId);

      const target = this.userRepository.findByConnectionId(targetId);
      if (target?.socketId) {
        this.emitToSocket(target.socketId, ServerEvent.CHAT_REQUEST_CANCELLED, {
          from: initiatorId,
          reason: 'Requester started a chat with someone else',
        });

        this.logger.info('Pending chat request cancelled', {
          initiator: initiatorId,
          target: targetId,
        });
      }
    }
  };

  handleChatMessage = (senderSocketId: string, message: string): void => {
    const sender = this.userRepository.findBySocketId(senderSocketId);

    if (!sender) {
      this.logger.warn('Message from unregistered socket', { senderSocketId });
      return;
    }

    if (sender.status !== UserStatus.IN_CHAT || !sender.chattingWith) {
      this.logger.warn('Message from user not in chat', {
        connectionId: sender.connectionId,
      });
      return;
    }

    // Validate message
    const validation = chatMessageSchema.safeParse(message);
    if (!validation.success) {
      this.logger.warn('Invalid message', {
        connectionId: sender.connectionId,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const partner = this.userRepository.findByConnectionId(sender.chattingWith);
    if (!partner?.socketId) {
      this.logger.warn('Partner not available for message', {
        sender: sender.connectionId,
        partner: sender.chattingWith,
      });
      return;
    }

    const messagePayload: ServerPayloadMap[ServerEvent.CHAT_MESSAGE_RECEIVED] = {
      id: uuidv4(),
      from: sender.connectionId,
      fromName: sender.name,
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Send to both users (sender gets confirmation, receiver gets message)
    this.emitToSocket(senderSocketId, ServerEvent.CHAT_MESSAGE_RECEIVED, messagePayload);
    this.emitToSocket(partner.socketId, ServerEvent.CHAT_MESSAGE_RECEIVED, messagePayload);

    this.logger.info('Chat message sent', {
      from: sender.connectionId,
      to: partner.connectionId,
      messageId: messagePayload.id,
      message,
    });
  };

  handleChatLeave = (leaverSocketId: string): void => {
    const leaver = this.userRepository.findBySocketId(leaverSocketId);

    if (!leaver) {
      this.logger.warn('Leave from unregistered socket', { leaverSocketId });
      return;
    }

    if (leaver.status !== UserStatus.IN_CHAT || !leaver.chattingWith) {
      this.logger.debug('Leave from user not in chat', {
        connectionId: leaver.connectionId,
      });
      return;
    }

    const partnerId = leaver.chattingWith;
    const partner = this.userRepository.findByConnectionId(partnerId);

    this.logger.info('User left chat', {
      leaver: leaver.connectionId,
      partner: partnerId,
    });

    // End chat for leaver
    this.userRepository.updateStatus(leaver.connectionId, UserStatus.ONLINE);
    this.userRepository.updateChattingWith(leaver.connectionId, null);

    // Notify and update partner
    if (partner) {
      this.userRepository.updateStatus(partner.connectionId, UserStatus.ONLINE);
      this.userRepository.updateChattingWith(partner.connectionId, null);

      if (partner.socketId) {
        this.emitToSocket(partner.socketId, ServerEvent.CHAT_ENDED, {
          reason: ChatEndReason.PARTNER_LEFT,
          message: `${leaver.name} has left the chat`,
        });
      }
    }
  };

  handlePartnerDisconnected = (disconnectedId: string, partnerId: string): void => {
    const partner = this.userRepository.findByConnectionId(partnerId);

    this.logger.info('Partner disconnected from chat', {
      disconnected: disconnectedId,
      partner: partnerId,
    });

    if (partner) {
      this.userRepository.updateStatus(partner.connectionId, UserStatus.ONLINE);
      this.userRepository.updateChattingWith(partner.connectionId, null);

      if (partner.socketId) {
        this.emitToSocket(partner.socketId, ServerEvent.CHAT_ENDED, {
          reason: ChatEndReason.PARTNER_DISCONNECTED,
          message: 'Your chat partner has disconnected',
        });
      }
    }
  };

  /**
   * Cleanup all pending requests for a disconnected user
   * - Cancels requests TO this user (they can't respond)
   * - Cancels requests FROM this user (they're gone)
   */
  cleanupPendingRequests = (connectionId: string): void => {
    // Cancel requests TO this user
    const pendingFromId = this.pendingRequests.get(connectionId);
    if (pendingFromId) {
      this.pendingRequests.delete(connectionId);
      this.logger.info('Pending request to disconnected user cleared', {
        target: connectionId,
        initiator: pendingFromId,
      });
    }

    // Cancel requests FROM this user
    this.cancelPendingRequestsFromUser(connectionId);
  };

  /**
   * Type-safe emit to a specific socket using ServerPayloadMap
   */
  private emitToSocket = <T extends ServerEvent>(
    socketId: string,
    event: T,
    payload: ServerPayloadMap[T]
  ): void => {
    this.io.to(socketId).emit(event, payload);
  };
}
