import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntentData } from './intentExtractor';
import { wfBuilderInterface } from './wfBuilderInterface';
import { auditLogger } from './auditLogger';
import { SessionManager } from './sessionManager';
import { WorkflowError, ERROR_CODES, createErrorResponse, logError } from '../utils/errorHandler';

// Initialize Gemini client with fallback for missing API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[WARNING] GEMINI_API_KEY not found in environment variables. Using mock responses.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-pro' });

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

export interface WorkflowActionResponse {
  status: 'success' | 'error' | 'clarification_needed' | 'info';
  messageForUser: string;
  originalUtterance?: string;
  canvasCommand?: {
    action: string;
    payload: any;
  } | null;
}

export class WorkflowActionHandler {
  private userId: string;
  private sessionId: string;
  private sessionManager: SessionManager;

  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.sessionManager = SessionManager.getInstance();
  }

  async getProbingQuestionAndRespond(probingPrompt: string, originalUserUtterance: string): Promise<WorkflowActionResponse> {
    try {
      // Check if we've reached max probing attempts
      if (this.sessionManager.hasReachedMaxProbingAttempts(this.sessionId)) {
        console.log(`[CHAT_LOG] Max probing attempts reached for session ${this.sessionId}`);
        return {
          status: 'info',
          messageForUser: "I'm still having trouble understanding. You could try:\n" +
            "1. Rephrasing your request\n" +
            "2. Type 'help' to see what I can do\n" +
            "3. Start with a simple command like 'Create a workflow'",
          canvasCommand: null
        };
      }

      // Increment probing attempts
      this.sessionManager.incrementProbingAttempts(this.sessionId);

      console.log(`[CHAT_LOG] Getting probing question. Prompt: ${probingPrompt}`);

      let probingQuestionText: string;

      if (!model) {
        probingQuestionText = this.getMockProbingQuestion(originalUserUtterance);
      } else {
        const result = await model.generateContent(probingPrompt);
        const response = await result.response;
        probingQuestionText = response.text().trim();
      }

      console.log(`[CHAT_LOG] Raw Gemini Response (Probing Question): ${probingQuestionText}`);

      const responsePayload: WorkflowActionResponse = {
        status: 'clarification_needed',
        messageForUser: probingQuestionText,
        originalUtterance: originalUserUtterance,
        canvasCommand: null
      };

      console.log(`[CHAT_LOG] Sending clarification_needed response: ${JSON.stringify(responsePayload)}`);
      return responsePayload;

    } catch (error) {
      const workflowError = error instanceof Error ? error : new Error(String(error));
      logError('getProbingQuestionAndRespond', workflowError, { userId: this.userId, sessionId: this.sessionId });
      return createErrorResponse(workflowError);
    }
  }

  async dispatchWorkflowAction(intentData: IntentData): Promise<WorkflowActionResponse> {
    try {
      console.log(`[CHAT_LOG] dispatchWorkflowAction called: Intent='${intentData.intent}', Entities='${JSON.stringify(intentData.entities)}'`);

      // Reset probing attempts on successful intent recognition
      this.sessionManager.resetProbingAttempts(this.sessionId);

      // Log the action
      auditLogger.logAction(
        'system',
        intentData.intent,
        intentData.entities,
        this.userId
      );

      // Update session state
      this.sessionManager.updateSessionState(this.sessionId, {
        lastIntent: intentData.intent,
        lastEntities: intentData.entities
      });

      switch (intentData.intent) {
        case 'CREATE_WORKFLOW':
          return await this.handleCreateWorkflow(intentData.entities);
        case 'ADD_STEP':
          return await this.handleAddStep(intentData.entities);
        case 'HELP':
          return await this.handleHelpRequest();
        default:
          throw new WorkflowError({
            code: ERROR_CODES.INVALID_INPUT,
            message: `I understood you wanted to '${intentData.intent}', but I don't know how to do that yet.`,
            details: { intent: intentData.intent }
          });
      }
    } catch (error) {
      const workflowError = error instanceof Error ? error : new Error(String(error));
      logError('dispatchWorkflowAction', workflowError, { userId: this.userId, sessionId: this.sessionId });
      return createErrorResponse(workflowError);
    }
  }

  private async handleHelpRequest(): Promise<WorkflowActionResponse> {
    const helpMessage =
      "I can help you with the following:\n\n" +
      "1. Create workflows:\n" +
      "   - 'Create a workflow called Monthly Report'\n" +
      "   - 'Make a new workflow for Data Processing'\n\n" +
      "2. Add steps to workflows:\n" +
      "   - 'Add a data input step to Monthly Report'\n" +
      "   - 'Add a validation step'\n\n" +
      "3. Get help:\n" +
      "   - Type 'help' anytime to see this message\n" +
      "   - Type 'examples' to see more examples\n\n" +
      "What would you like to do?";

    return {
      status: 'info',
      messageForUser: helpMessage,
      canvasCommand: null
    };
  }

  private async handleCreateWorkflow(entities: Record<string, string>): Promise<WorkflowActionResponse> {
    const workflowName = entities.workflow_name;
    console.log(`[WF_BUILDER_ACTION] handleCreateWorkflow called for name: '${workflowName}' by user ${this.userId}`);

    // Validate workflow name
    if (!workflowName || workflowName.trim() === '') {
      console.warn(`[WF_BUILDER_ACTION] Invalid workflow name: '${workflowName}'`);
      return {
        status: 'error',
        messageForUser: 'The workflow name cannot be empty. Please try again.',
        canvasCommand: null
      };
    }

    // Check for invalid characters in workflow name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(workflowName)) {
      console.warn(`[WF_BUILDER_ACTION] Workflow name contains invalid characters: '${workflowName}'`);
      return {
        status: 'error',
        messageForUser: 'The workflow name contains invalid characters. Please use only letters, numbers, spaces, and basic punctuation.',
        canvasCommand: null
      };
    }

    // Check workflow name length
    if (workflowName.length > 100) {
      console.warn(`[WF_BUILDER_ACTION] Workflow name too long: '${workflowName}'`);
      return {
        status: 'error',
        messageForUser: 'The workflow name is too long. Please use a name with 100 characters or less.',
        canvasCommand: null
      };
    }

    try {
      // Create the workflow using the WF-Builder interface
      const response = await wfBuilderInterface.create_empty_workflow(workflowName);
      console.log(`[WF_BUILDER_ACTION] Successfully created workflow definition for '${workflowName}' with ID '${response.workflowId}'`);

      // Log the successful creation
      auditLogger.logAction(
        'system',
        'CREATE_WORKFLOW',
        {
          workflowId: response.workflowId,
          workflowName,
          userId: this.userId,
          sessionId: this.sessionId
        },
        this.userId
      );

      // Return success response with canvas command
      return {
        status: 'success',
        messageForUser: `I've created a new workflow called "${workflowName}". What would you like to do next?`,
        canvasCommand: {
          action: 'CREATE_WORKFLOW',
          payload: {
            workflowId: response.workflowId,
            name: workflowName,
            createdAt: new Date().toISOString(),
            createdBy: this.userId
          }
        }
      };
    } catch (error) {
      console.error(`[WF_BUILDER_ACTION] Error creating workflow '${workflowName}': ${error}`);

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return {
            status: 'error',
            messageForUser: `A workflow named "${workflowName}" already exists. Please choose a different name.`,
            canvasCommand: null
          };
        }
      }

      return {
        status: 'error',
        messageForUser: 'Failed to create the workflow. Please try again.',
        canvasCommand: null
      };
    }
  }

  private async handleAddStep(entities: Record<string, string>): Promise<WorkflowActionResponse> {
    const stepName = entities.step_name;
    const workflowTarget = entities.workflow_target;

    console.log(`[WF_BUILDER_ACTION] handleAddStep called for step: '${stepName}' in workflow: '${workflowTarget}' by user ${this.userId}`);

    // Validate step name
    if (!stepName || stepName.trim() === '') {
      console.warn(`[WF_BUILDER_ACTION] Invalid step name: '${stepName}'`);
      return {
        status: 'error',
        messageForUser: 'The step name cannot be empty. Please try again.',
        canvasCommand: null
      };
    }

    // Check for invalid characters in step name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(stepName)) {
      console.warn(`[WF_BUILDER_ACTION] Step name contains invalid characters: '${stepName}'`);
      return {
        status: 'error',
        messageForUser: 'The step name contains invalid characters. Please use only letters, numbers, spaces, and basic punctuation.',
        canvasCommand: null
      };
    }

    // Check step name length
    if (stepName.length > 100) {
      console.warn(`[WF_BUILDER_ACTION] Step name too long: '${stepName}'`);
      return {
        status: 'error',
        messageForUser: 'The step name is too long. Please use a name with 100 characters or less.',
        canvasCommand: null
      };
    }

    // Validate workflow target
    if (!workflowTarget || workflowTarget.trim() === '') {
      console.warn(`[WF_BUILDER_ACTION] Invalid workflow target: '${workflowTarget}'`);
      return {
        status: 'error',
        messageForUser: 'Please specify which workflow to add the step to.',
        canvasCommand: null
      };
    }

    try {
      // Add the step using the WF-Builder interface
      const response = await wfBuilderInterface.add_step_to_workflow(workflowTarget, {
        name: stepName,
        type: 'step',
        createdBy: this.userId,
        createdAt: new Date().toISOString()
      });

      console.log(`[WF_BUILDER_ACTION] Successfully added step '${stepName}' to workflow '${workflowTarget}' with ID '${response.stepId}'`);

      // Log the successful addition
      auditLogger.logAction(
        'system',
        'ADD_STEP',
        {
          stepId: response.stepId,
          stepName,
          workflowId: workflowTarget,
          userId: this.userId,
          sessionId: this.sessionId
        },
        this.userId
      );

      // Return success response with canvas command
      return {
        status: 'success',
        messageForUser: `I've added a step called "${stepName}" to the workflow "${workflowTarget}". What should this step do?`,
        canvasCommand: {
          action: 'ADD_STEP',
          payload: {
            stepId: response.stepId,
            workflowId: workflowTarget,
            name: stepName,
            createdAt: new Date().toISOString(),
            createdBy: this.userId
          }
        }
      };
    } catch (error) {
      console.error(`[WF_BUILDER_ACTION] Error adding step '${stepName}' to workflow '${workflowTarget}': ${error}`);

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('workflow not found')) {
          return {
            status: 'error',
            messageForUser: `The workflow "${workflowTarget}" was not found. Please check the workflow name and try again.`,
            canvasCommand: null
          };
        }
        if (error.message.includes('step already exists')) {
          return {
            status: 'error',
            messageForUser: `A step named "${stepName}" already exists in this workflow. Please choose a different name.`,
            canvasCommand: null
          };
        }
      }

      return {
        status: 'error',
        messageForUser: 'Failed to add the step. Please try again.',
        canvasCommand: null
      };
    }
  }

  private getMockProbingQuestion(originalUserUtterance: string): string {
    return `I see you mentioned "${originalUserUtterance}". Are you trying to create a new workflow or modify an existing one?`;
  }
}