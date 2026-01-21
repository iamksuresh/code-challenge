import { ChatEndReason } from './events';

// ─── Client → Server Payloads ───

export interface UserRegisterPayload {
  connectionId: string;
  name?: string;
}

export interface ChatRequestPayload {
  targetConnectionId: string;
}

export interface ChatResponsePayload {
  fromConnectionId: string;
  accepted: boolean;
}

export interface ChatMessagePayload {
  message: string;
}

export interface ChatLeavePayload {}

// ─── Server → Client Payloads ───

export interface UserRegisteredPayload {
  success: boolean;
  error?: string;
}

export interface ChatIncomingRequestPayload {
  from: string;
  fromName: string;
}

export interface ChatRequestResultPayload {
  success: boolean;
  error?: string;
  isBusy?: boolean;
  targetName?: string;
}

export interface ChatStartedPayload {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  isInitiator: boolean;
}

export interface ChatMessageReceivedPayload {
  id: string;
  from: string;
  fromName: string;
  content: string;
  timestamp: string;
}

export interface ChatEndedPayload {
  reason: ChatEndReason;
  message: string;
}

export interface ChatRequestCancelledPayload {
  from: string;
  reason: string;
}
