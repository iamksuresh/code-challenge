import { Router } from 'express';
import { ConnectionController } from '../controllers/connectionController';
import { IConnectionService } from '../services/IConnectionService';

export const createConnectionRoutes = (connectionService: IConnectionService): Router => {
  const router = Router();
  const controller = new ConnectionController(connectionService);

  router.get('/connection-id/generate', controller.generateConnectionId);
  router.post('/connection-id/validate', controller.validateConnectionId);
  router.post('/connection-id/register', controller.registerUser);

  return router;
};
