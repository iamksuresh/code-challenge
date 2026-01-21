import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createConnectionRoutes } from '../../src/routes/connectionRoutes';
import { IConnectionService } from '../../src/services/IConnectionService';

describe('Connection Routes', () => {
  let app: Express;
  let mockConnectionService: IConnectionService;

  beforeEach(() => {
    // Create mock connection service
    mockConnectionService = {
      generateConnectionId: vi.fn(),
      validateConnectionId: vi.fn(),
      registerUser: vi.fn(),
      handleReconnection: vi.fn(),
      handleDisconnection: vi.fn(),
    };

    // Create express app with the routes
    app = express();
    app.use(express.json());
    app.use('/chat', createConnectionRoutes(mockConnectionService));
  });

  describe('GET /chat/connection-id/generate', () => {
    it('should return a new connection ID on success', async () => {
      const mockResponse = {
        success: true,
        data: { connectionId: '042' },
      };
      vi.mocked(mockConnectionService.generateConnectionId).mockReturnValue(mockResponse);

      const response = await request(app).get('/chat/connection-id/generate');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockConnectionService.generateConnectionId).toHaveBeenCalledTimes(1);
    });

    it('should return error response when service fails', async () => {
      const mockResponse = {
        success: false,
        error: 'No connection IDs available',
      };
      vi.mocked(mockConnectionService.generateConnectionId).mockReturnValue(mockResponse);

      const response = await request(app).get('/chat/connection-id/generate');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /chat/connection-id/validate', () => {
    it('should return valid=true for an available connection ID', async () => {
      const mockResponse = {
        success: true,
        data: { valid: true, available: true },
      };
      vi.mocked(mockConnectionService.validateConnectionId).mockReturnValue(mockResponse);

      const response = await request(app)
        .post('/chat/connection-id/validate')
        .send({ connectionId: '042' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockConnectionService.validateConnectionId).toHaveBeenCalledWith('042');
    });

    it('should return 400 for invalid connection ID format', async () => {
      const response = await request(app)
        .post('/chat/connection-id/validate')
        .send({ connectionId: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('3 digits');
      expect(mockConnectionService.validateConnectionId).not.toHaveBeenCalled();
    });
  });

  describe('POST /chat/connection-id/register', () => {
    it('should return success for valid registration data', async () => {
      const response = await request(app)
        .post('/chat/connection-id/register')
        .send({ connectionId: '042', name: 'TestUser' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('WebSocket');
    });

    it('should return 400 for invalid name format', async () => {
      const response = await request(app)
        .post('/chat/connection-id/register')
        .send({ connectionId: '042', name: 'ab' }); // Too short

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('at least 3 characters');
    });
  });
});
