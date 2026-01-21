// Local storage utils only for POC and not for production.

import { StoredUser, ChatMessage } from '../types';

// Storage Keys
const STORAGE_KEYS = {
  USER: 'wave_chat_user',
  CHAT_PREFIX: 'chat_',
} as const;

export const saveUser = (user: StoredUser): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user to localStorage:', error);
  }
};

export const getUser = (): StoredUser | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return null;
    return JSON.parse(data) as StoredUser;
  } catch (error) {
    console.error('Failed to get user from localStorage:', error);
    return null;
  }
};

export const removeUser = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Failed to remove user from localStorage:', error);
  }
};

export const hasStoredUser = (): boolean => {
  return getUser() !== null;
};

const getChatKey = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort();
  return `${STORAGE_KEYS.CHAT_PREFIX}${sortedIds[0]}_${sortedIds[1]}`;
};

export const saveChatHistory = (
  myConnectionId: string,
  partnerConnectionId: string,
  messages: ChatMessage[]
): void => {
  try {
    const key = getChatKey(myConnectionId, partnerConnectionId);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

export const getChatHistory = (
  myConnectionId: string,
  partnerConnectionId: string
): ChatMessage[] => {
  try {
    const key = getChatKey(myConnectionId, partnerConnectionId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data) as ChatMessage[];
  } catch (error) {
    console.error('Failed to get chat history:', error);
    return [];
  }
};

export const clearChatHistory = (
  myConnectionId: string,
  partnerConnectionId: string
): void => {
  try {
    const key = getChatKey(myConnectionId, partnerConnectionId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
};

export const addMessageToHistory = (
  myConnectionId: string,
  partnerConnectionId: string,
  message: ChatMessage
): void => {
  const history = getChatHistory(myConnectionId, partnerConnectionId);
  saveChatHistory(myConnectionId, partnerConnectionId, [...history, message]);
};

export const clearAllChatData = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEYS.CHAT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear chat data:', error);
  }
};

export const clearAllData = (): void => {
  removeUser();
  clearAllChatData();
};
