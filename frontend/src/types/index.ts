// ─── User Types ───
export type StoredUser = {
  connectionId: string;
  name: string;
};

// ─── Chat Types ───
export type ChatMessage = {
  id: string;
  from: string;
  fromName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
};

export type ChatPartner = {
  connectionId: string;
  name: string;
};

export type ChatSession = {
  sessionId: string;
  partner: ChatPartner;
  isInitiator: boolean;
  startedAt: string;
};

// ─── API Response Types ───
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

// ─── Incoming Request ───
export type IncomingChatRequest = {
  from: string;
  fromName: string;
};

// ─── App State ───
export type AppView = 'home' | 'chat';

export type AppState = {
  view: AppView;
  isRegistered: boolean;
  isConnected: boolean;
};
