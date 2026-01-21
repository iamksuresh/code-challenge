import { Request, Response } from 'express';
import { IConnectionService } from '../services/IConnectionService';
import { registerRequestSchema, validateRequestSchema } from '../schemas/validation';
import { ApiResponse, GenerateConnectionIdResponse, ValidateConnectionIdResponse } from '../types';

export class ConnectionController {
  constructor(private connectionService: IConnectionService) {}

  generateConnectionId = (_req: Request, res: Response): void => {
    const result = this.connectionService.generateConnectionId();
    res.json(result);
  };

  validateConnectionId = (req: Request, res: Response): void => {
    const parseResult = validateRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const response: ApiResponse<ValidateConnectionIdResponse> = {
        success: false,
        error: parseResult.error.errors[0].message,
      };
      res.status(400).json(response);
      return;
    }

    const result = this.connectionService.validateConnectionId(parseResult.data.connectionId);
    res.json(result);
  };

  registerUser = (req: Request, res: Response): void => {
    const parseResult = registerRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const response: ApiResponse = {
        success: false,
        error: parseResult.error.errors[0].message,
      };
      res.status(400).json(response);
      return;
    }

    // Note: Socket ID is not available in REST endpoint
    // Registration via REST is for validation only
    // Actual registration happens via WebSocket
    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Validation passed. Complete registration via WebSocket connection.',
      },
    };
    res.json(response);
  };
}
