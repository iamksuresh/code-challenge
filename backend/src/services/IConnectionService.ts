import { ApiResponse, GenerateConnectionIdResponse, ValidateConnectionIdResponse } from '../types';

export interface IConnectionService {
  // Generate a new unique connection ID
  generateConnectionId(): ApiResponse<GenerateConnectionIdResponse>;
  // Validate connection ID format and availability
  validateConnectionId(connectionId: string): ApiResponse<ValidateConnectionIdResponse>;
  // Register a user with connection ID and name
  registerUser(
    connectionId: string,
    name: string,
    socketId: string
  ): ApiResponse<{ suggestedConnectionId?: string }>;
  handleReconnection(connectionId: string, socketId: string): ApiResponse;
  handleDisconnection(socketId: string): void;
}
