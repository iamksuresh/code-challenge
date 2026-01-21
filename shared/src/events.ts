// ─── Event Enums ───

export enum ClientEvent {
  USER_REGISTER = 'user:register',
  CHAT_REQUEST = 'chat:request',
  CHAT_RESPONSE = 'chat:response',
  CHAT_MESSAGE = 'chat:message',
  CHAT_LEAVE = 'chat:leave',
}

export enum ServerEvent {
  USER_REGISTERED = 'user:registered',
  CHAT_INCOMING_REQUEST = 'chat:incoming-request',
  CHAT_REQUEST_RESULT = 'chat:request-result',
  CHAT_REQUEST_CANCELLED = 'chat:request-cancelled',
  CHAT_STARTED = 'chat:started',
  CHAT_MESSAGE_RECEIVED = 'chat:message-received',
  CHAT_ENDED = 'chat:ended',
}

export enum ChatEndReason {
  PARTNER_LEFT = 'partner_left',
  PARTNER_DISCONNECTED = 'partner_disconnected',
}

export enum UserStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  IN_CHAT = 'in_chat',
}
