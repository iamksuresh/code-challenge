const IS_DEVELOPMENT = import.meta.env.DEV;

export const config = {
  API_BASE_URL: IS_DEVELOPMENT ? 'http://localhost:3001' : '',
  SOCKET_ENDPOINT: IS_DEVELOPMENT ? 'http://localhost:3001' : '',
} as const;
