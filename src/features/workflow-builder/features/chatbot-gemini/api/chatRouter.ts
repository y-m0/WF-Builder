import { Router } from 'express';
import { handleChatRequest } from './chatController';
import { requestLogger, errorHandler, validateSession } from './middleware/chatMiddleware';

const router = Router();

// Apply middleware
router.use(requestLogger);

// POST /api/v1/workflow-chat
router.post('/workflow-chat', validateSession, handleChatRequest);

// Apply error handling middleware last
router.use(errorHandler);

export default router;