// Dialogue State Types
export type DialogueState = 'IDLE' | 'AWAITING_WORKFLOW_NAME' | 'AWAITING_TOOL_NAME' | 'COMPLETE';

export interface DialogueContext {
  workflowName?: string;
  toolName?: string;
}

export interface DialogueAction {
  type: 'PROMPT_FOR_WORKFLOW_NAME' | 'CREATE_WORKFLOW' | 'PROMPT_FOR_TOOL_NAME' | 'ADD_TOOL' | 'NONE';
  payload?: any;
}

export interface DialogueResult {
  state: DialogueState;
  context: DialogueContext;
  action: DialogueAction;
  message?: string;
} 