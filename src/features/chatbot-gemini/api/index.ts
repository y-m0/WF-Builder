import { Router } from 'express';
import chatRouter from './chatRouter';

const apiRouter = Router();

// Mount chat router at /api/v1
apiRouter.use('/api/v1', chatRouter);

export default apiRouter; 