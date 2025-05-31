import { Request, Response, NextFunction } from 'express';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request details
  console.log(`[API_LOG] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`[API_LOG] Headers:`, req.headers);
  console.log(`[API_LOG] Body:`, req.body);

  // Log response when it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API_LOG] ${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`[API_ERROR] ${new Date().toISOString()} - Error processing ${req.method} ${req.path}:`, err);

  res.status(500).json({
    status: 'error',
    messageForUser: 'An unexpected error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_SERVER_ERROR'
  });
};

// Session validation middleware
export const validateSession = (req: Request, res: Response, next: NextFunction): void => {
  const { sessionId, userId } = req.body;

  if (!sessionId || !userId) {
    res.status(400).json({
      status: 'error',
      messageForUser: 'Session ID and User ID are required.',
      error: 'INVALID_SESSION'
    });
    return;
  }

  // Add additional session validation logic here
  // For example, check if the session is expired, validate user permissions, etc.

  next();
};