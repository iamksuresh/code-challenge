export interface IChatService {
  // Handle chat request from initiator to target
  handleChatRequest(initiatorSocketId: string, targetConnectionId: string): void;

  // Handle response to chat request (accept/decline)
  handleChatResponse(
    responderSocketId: string,
    fromConnectionId: string,
    accepted: boolean
  ): void;

  // Handle chat message
  handleChatMessage(senderSocketId: string, message: string): void;

  // Handle user leaving chat voluntarily
  handleChatLeave(leaverSocketId: string): void;

  // Handle partner disconnected (called by ConnectionService)
  handlePartnerDisconnected(disconnectedId: string, partnerId: string): void;

  // Cleanup pending requests for a disconnected user
  cleanupPendingRequests(connectionId: string): void;
}
