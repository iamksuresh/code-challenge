// API utils and methods.
// Using fetch but Axios can be used for production.

import { config } from '../config';
import {
  ApiResponse,
  GenerateConnectionIdResponse,
  ValidateConnectionIdResponse,
} from '../types';
import { API_ENDPOINTS } from '../constants/endpoints';

// ─── API Base URL ───
const API_BASE = config.API_BASE_URL;

const fetchJson = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

export const generateConnectionId = async (): Promise<
  ApiResponse<GenerateConnectionIdResponse>
> => {
  return fetchJson<GenerateConnectionIdResponse>(API_ENDPOINTS.CHAT.GENERATE_CONNECTION_ID);
};

export const validateConnectionId = async (
  connectionId: string
): Promise<ApiResponse<ValidateConnectionIdResponse>> => {
  return fetchJson<ValidateConnectionIdResponse>(API_ENDPOINTS.CHAT.VALIDATE_CONNECTION_ID, {
    method: 'POST',
    body: JSON.stringify({ connectionId }),
  });
};

export const validateRegistration = async (
  connectionId: string,
  name: string
): Promise<ApiResponse<{ message: string }>> => {
  return fetchJson<{ message: string }>(API_ENDPOINTS.CHAT.REGISTER, {
    method: 'POST',
    body: JSON.stringify({ connectionId, name }),
  });
};

export const api = {
  generateConnectionId,
  validateConnectionId,
  validateRegistration,
};
