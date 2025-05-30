import { WorkflowActionResponse } from '../services/workflowActionHandler';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
}

export class WorkflowError extends Error {
  public code: string;
  public details?: any;

  constructor(errorDetails: ErrorDetails) {
    super(errorDetails.message);
    this.name = 'WorkflowError';
    this.code = errorDetails.code;
    this.details = errorDetails.details;
  }
}

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
  STEP_NOT_FOUND: 'STEP_NOT_FOUND',
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  MAX_PROBING_ATTEMPTS: 'MAX_PROBING_ATTEMPTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

export function createErrorResponse(error: Error | WorkflowError): WorkflowActionResponse {
  console.error(`[ERROR] ${error.name}: ${error.message}`, error instanceof WorkflowError ? error.details : '');

  if (error instanceof WorkflowError) {
    return {
      status: 'error',
      messageForUser: error.message,
      canvasCommand: null
    };
  }

  // Handle unknown errors
  return {
    status: 'error',
    messageForUser: 'An unexpected error occurred. Please try again.',
    canvasCommand: null
  };
}

export function logError(context: string, error: Error | WorkflowError, metadata?: Record<string, any>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      code: error instanceof WorkflowError ? error.code : 'UNKNOWN',
      details: error instanceof WorkflowError ? error.details : undefined
    },
    metadata
  };

  console.error(`[ERROR_LOG] ${JSON.stringify(errorLog)}`);
}

export function validateInput(input: any, rules: Record<string, (value: any) => boolean>, context: string): void {
  for (const [field, validator] of Object.entries(rules)) {
    if (!validator(input[field])) {
      throw new WorkflowError({
        code: ERROR_CODES.INVALID_INPUT,
        message: `Invalid ${field} in ${context}`,
        details: { field, value: input[field] }
      });
    }
  }
} 