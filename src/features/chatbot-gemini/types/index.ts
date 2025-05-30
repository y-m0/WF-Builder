export interface UserContext {
  name: string;
  role: string;
  userId?: string;
}

export interface GeminiResponse {
  intent: string;
  entities: Record<string, any>;
  userResponse: string;
  wfBuilderAction?: {
    function: string;
    parameters: Record<string, any>;
  };
  status?: 'needs_parameters';
  dialogueContinuation?: Array<{
    userResponse: string;
    awaitingParameter: string;
  }>;
  collectedParameters?: Record<string, any>;
}

export interface DialogueState {
  currentConnector?: string;
  currentTool?: string;
  collectedParameters: Record<string, any>;
  awaitingParameter?: string;
}

export interface WorkflowResponse {
  workflowId: string;
  status: string;
}

export interface StepResponse {
  stepId: string;
  status: string;
}

export interface RationaleResponse {
  status: string;
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  role: string;
  intent: string;
  parameters: Record<string, any>;
  status?: string;
} 