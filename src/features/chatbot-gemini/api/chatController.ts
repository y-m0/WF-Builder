import { Request, Response } from 'express';
import { BackendService } from '../services/BackendService';
import { UserContext } from '../types';
import { IntentExtractor } from '../services/intentExtractor';
import { WorkflowActionHandler, WorkflowActionResponse } from '../services/workflowActionHandler';

const PROBING_QUESTION_SYSTEM_PROMPT_TEMPLATE = `
You are an AI assistant for WF-Builder. The user's previous request was not fully understood.
Their original message was: "{ORIGINAL_USER_UTTERANCE}"

WF-Builder can help users:
- Create new workflows (e.g., "Create a financial report workflow")
- Add steps to existing workflows (e.g., "Add a data validation step to my report")
- Define parameters for these steps
- Connect steps in a sequence
- And generally manage their automated business processes.

Your task is to generate a SINGLE, clear, and helpful question to ask the user to clarify their intention or provide missing information relevant to these workflow capabilities.
Focus on understanding what the user wants to *do* with a workflow.
Do not try to complete the task yourself, only ask one clarifying question.
If the user's request seems completely unrelated to workflow building, you can ask a more general clarifying question like 'How can I help you with workflows today?'
Respond ONLY with the question.
`;

interface ChatRequest {
  userId: string;
  sessionId: string;
  message: string;
  role?: string;
  name?: string;
}

interface ChatResponse {
  status: 'success' | 'error' | 'info';
  messageForUser: string;
  canvasCommand?: {
    type: string;
    payload: any;
  } | null;
  error?: string;
}

// In-memory session store (replace with proper session management in production)
const sessionStore = new Map<string, BackendService>();

export const handleChatRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId, message, role = 'User', name = 'Anonymous' }: ChatRequest = req.body;

    // Input validation
    if (!message?.trim()) {
      res.status(400).json({
        status: 'error',
        messageForUser: 'Message cannot be empty.',
        error: 'EMPTY_MESSAGE'
      });
      return;
    }

    if (!userId || !sessionId) {
      res.status(400).json({
        status: 'error',
        messageForUser: 'User ID and Session ID are required.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    // Log the received message
    console.log(`[CHAT_LOG] Received message from ${userId} (Session: ${sessionId}): "${message}"`);

    // Get or create BackendService instance for this session
    let backendService = sessionStore.get(sessionId);
    if (!backendService) {
      const userContext: UserContext = {
        userId,
        role,
        name
      };
      backendService = new BackendService(userContext);
      sessionStore.set(sessionId, backendService);
    }

    // Process the message
    const response = await processUserMessage(req, res);
    res.json(response);

  } catch (error) {
    console.error('[CHAT_ERROR]', error);
    res.status(500).json({
      status: 'error',
      messageForUser: 'An error occurred while processing your message.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    });
  }
};

export async function processUserMessage(req: Request, res: Response): Promise<void> {
  const { message, userId, sessionId } = req.body;

  // Validate required fields
  if (!message || !userId || !sessionId) {
    res.status(400).json({
      status: 'error',
      messageForUser: 'Missing required fields: message, userId, or sessionId',
      canvasCommand: null
    });
    return;
  }

  try {
    // Initialize user context
    const userContext: UserContext = {
      name: 'User',
      role: 'user'
    };

    // Initialize services
    const intentExtractor = new IntentExtractor(userContext);
    const workflowActionHandler = new WorkflowActionHandler(userId, sessionId);

    // Extract intent
    const probingResult = await intentExtractor.extractIntent(message);

    // Handle probing or dispatch action
    let response: WorkflowActionResponse;
    if (probingResult.needsProbing && probingResult.probingQuestion) {
      response = await workflowActionHandler.getProbingQuestionAndRespond(
        probingResult.probingQuestion,
        message
      );
    } else if (probingResult.intentData) {
      response = await workflowActionHandler.dispatchWorkflowAction(probingResult.intentData);
    } else {
      response = {
        status: 'error',
        messageForUser: 'Unable to process your request. Please try again.',
        canvasCommand: null
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      status: 'error',
      messageForUser: 'An unexpected error occurred. Please try again.',
      canvasCommand: null
    });
  }
}

function parseCanvasCommand(response: string): ChatResponse['canvasCommand'] {
  // This is a placeholder for parsing canvas commands from the response
  // In a real implementation, this would parse specific command patterns
  // and return appropriate canvas commands
  return null;
} 