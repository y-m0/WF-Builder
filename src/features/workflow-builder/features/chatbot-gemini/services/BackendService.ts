import { UserContext } from '../types';
import { IntentData, ProbingResult } from './intentExtractor';
import { auditLogger } from './auditLogger';
import { wfBuilderInterface } from './wfBuilderInterface';
import connectors from '../metadata/connectors.json';
import tools from '../metadata/toolMetadata.json';
import complianceRules from '../metadata/complianceRules.json';
import bestPractices from '../metadata/bestPractices.json';
import workflowTemplates from '../metadata/workflowTemplates.json';

interface DialogueState {
  collectedParameters: Record<string, any>;
  lastIntent?: IntentData;
  currentConnector?: string;
  currentTool?: string;
  awaitingParameter?: string;
}

export class BackendService {
  private userContext: UserContext;
  private dialogueState: DialogueState;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    this.dialogueState = {
      collectedParameters: {}
    };
  }

  getUserContext(): UserContext {
    return this.userContext;
  }

  async handleUserQuery(userMessage: string, probingResult?: ProbingResult): Promise<string> {
    try {
      // If probing is needed, return the probing question
      if (probingResult?.needsProbing) {
        this.dialogueState.lastIntent = probingResult.intentData;
        return probingResult.probingQuestion || "I need more information to help you. Could you please clarify?";
      }

      // If we have intent data, use it for structured handling
      if (probingResult?.intentData) {
        const response = await this.handleIntent(probingResult.intentData, userMessage);
        this.dialogueState.lastIntent = probingResult.intentData;
        return response;
      }

      // Fallback to mock Gemini interaction for backward compatibility
      return this.mockGeminiInteraction(userMessage);
    } catch (error) {
      console.error('[BACKEND_ERROR]', error);
      throw error;
    }
  }

  private async handleIntent(intentData: IntentData, userMessage: string): Promise<string> {
    // Log the intent
    auditLogger.logAction(
      this.userContext.role,
      intentData.intent,
      intentData.entities,
      this.userContext.userId
    );

    switch (intentData.intent) {
      case 'CREATE_WORKFLOW':
        return this.handleCreateWorkflow(intentData.entities);
      case 'ADD_STEP':
        return this.handleAddStep(intentData.entities);
      case 'UNKNOWN':
        return this.handleUnknownIntent(userMessage);
      default:
        return this.handleUnknownIntent(userMessage);
    }
  }

  private handleCreateWorkflow(entities: Record<string, string>): string {
    const workflowName = entities.workflow_name;
    if (!workflowName) {
      return "I'll help you create a workflow. What would you like to name it?";
    }

    // Create the workflow
    wfBuilderInterface.create_empty_workflow(workflowName);
    return `I'll help you create a workflow called "${workflowName}". What would you like to do first?`;
  }

  private handleAddStep(entities: Record<string, string>): string {
    const stepName = entities.step_name;
    const workflowTarget = entities.workflow_target;

    if (!stepName) {
      return "What step would you like to add to your workflow?";
    }

    if (!workflowTarget) {
      return `I'll help you add a step called "${stepName}". Which workflow should I add it to?`;
    }

    // Add the step to the workflow
    wfBuilderInterface.add_step_to_workflow(workflowTarget, {
      name: stepName,
      type: 'step'
    });

    return `I'll add a step called "${stepName}" to the workflow "${workflowTarget}". What should this step do?`;
  }

  private handleUnknownIntent(userMessage: string): string {
    return `I'm not sure I understand what you want to do with "${userMessage}". Could you please rephrase that?`;
  }

  private mockGeminiInteraction(userInput: string): string {
    const lowerInput = userInput.toLowerCase();

    // Handle workflow creation
    if (lowerInput.includes('create') || lowerInput.includes('make') || lowerInput.includes('build')) {
      const workflowName = this.extractWorkflowName(userInput);
      return `I'll help you create a workflow named "${workflowName}". What's the first system or data source this workflow needs to interact with?`;
    }

    // Handle template-based workflow creation
    if (lowerInput.includes('template') || lowerInput.includes('show templates')) {
      const templates = this.getAvailableTemplates();
      if (templates.length > 0) {
        const templateList = templates.map(t => `- ${t.name}: ${t.description}`).join('\n');
        return `Here are the available templates for your role:\n${templateList}\n\nWhich template would you like to use?`;
      }
      return "I couldn't find any templates available for your role.";
    }

    // Handle connector setup
    if (lowerInput.includes('connect to') || lowerInput.includes('setup') || lowerInput.includes('configure')) {
      const connector = this.findConnector(userInput);
      if (connector) {
        this.dialogueState.currentConnector = connector.connectorId;
        const firstParam = connector.parameters[0];
        return `To connect to ${connector.name}, I need the ${firstParam.label}. ${firstParam.description}`;
      }
    }

    // Handle tool setup
    if (lowerInput.includes('add') || lowerInput.includes('use') || lowerInput.includes('include')) {
      const tool = this.findTool(userInput);
      if (tool) {
        this.dialogueState.currentTool = tool.toolId;
        const firstParam = tool.parameters[0];
        return `To add ${tool.name}, I need the ${firstParam.label}. ${firstParam.description}`;
      }
    }

    return "I'm not sure I understand. Could you please rephrase your request?";
  }

  private findConnector(input: string): any {
    return connectors.connectors.find(connector =>
      input.toLowerCase().includes(connector.name.toLowerCase())
    );
  }

  private findTool(input: string): any {
    return tools.tools.find(tool =>
      input.toLowerCase().includes(tool.name.toLowerCase())
    );
  }

  private extractWorkflowName(input: string): string {
    const match = input.match(/workflow (?:called|named|for) "?([^"]+)"?/i) ||
                 input.match(/create (?:a|an) (?:workflow|automation) (?:called|named|for) "?([^"]+)"?/i) ||
                 input.match(/make (?:a|an) (?:workflow|automation) (?:called|named|for) "?([^"]+)"?/i);

    if (match && match[1]) {
      return match[1];
    }

    const words = input.split(' ');
    return words[words.length - 1].replace(/[.,!?]$/, '');
  }

  private getAvailableTemplates(): any[] {
    return workflowTemplates.templates.filter(template =>
      template.allowedRoles.includes(this.userContext.role)
    );
  }
}