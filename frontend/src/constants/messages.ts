// ─── Error Messages ───
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to server. Please try again.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  INVALID_CONNECTION_ID: 'Connection ID must be exactly 3 digits (e.g., 001, 042, 999)',
  CONNECTION_ID_TAKEN: 'This connection ID is already in use',
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_SHORT: 'Name must be at least 3 characters',
  NAME_TOO_LONG: 'Name must be 50 characters or less',
  NAME_INVALID: 'Name can only contain letters and numbers',
  USER_NOT_FOUND: 'User not found',
  USER_OFFLINE: 'User is offline',
  MULTI_TAB_ERROR: 'Wave Chat is already open in another tab',
  CHAT_REQUEST_FAILED: 'Failed to send chat request',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  SELF_CHAT: 'You cannot chat with yourself',
} as const;

// ─── Success Messages ───
export const SUCCESS_MESSAGES = {
  REGISTERED: 'Successfully registered!',
  CHAT_REQUEST_SENT: 'Chat request sent',
  CHAT_STARTED: 'Chat started!',
} as const;

// ─── Info Messages ───
export const INFO_MESSAGES = {
  WAITING_FOR_RESPONSE: 'Waiting for response...',
  PARTNER_LEFT: 'Your chat partner has left the chat',
  PARTNER_DISCONNECTED: 'Your chat partner has disconnected',
  AUTO_GREETING: 'Hi',
} as const;

// ─── UI Labels ───
export const UI_LABELS = {
  APP_TITLE: 'Wave Chat',
  REGISTER: 'Register',
  GENERATE_ID: 'Generate ID',
  START_CHAT: 'Start Chat',
  SEND: 'Send',
  ACCEPT: 'Accept',
  DECLINE: 'Decline',
  LEAVE_CHAT: 'Leave Chat',
  YOUR_CONNECTION_ID: 'Your Connection ID',
  ENTER_NAME: 'Enter your name',
  TARGET_CONNECTION_ID: 'Enter connection ID to chat with',
  TYPE_MESSAGE: 'Type a message...',
  INCOMING_REQUEST: 'Incoming Chat Request',
  USER_BUSY: 'User Unavailable',
  DISMISS: 'OK',
} as const;
