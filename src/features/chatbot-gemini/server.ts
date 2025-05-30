import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processUserMessage } from './api/chatController';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    await processUserMessage(req, res);
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      status: 'error',
      messageForUser: 'An unexpected error occurred. Please try again.',
      canvasCommand: null
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Log level: ${process.env.LOG_LEVEL}`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not found in environment variables. AI features will use mock responses.');
  }
}); 