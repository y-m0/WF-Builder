import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserContext } from '../types';

// Initialize Gemini client with fallback for missing API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[WARNING] GEMINI_API_KEY not found in environment variables. Using mock responses.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-pro' });

const STRUCTURED_INTENT_SYSTEM_PROMPT = `
You are an AI assistant for WF-Builder, a tool that creates business workflows.
Your primary task is to understand user requests and identify their intent and any relevant details (entities) for predefined actions.
Supported actions and their required entities are:
1.  CREATE_WORKFLOW: User wants to make a new workflow.
    - Entities: {"workflow_name": "The name of the new workflow"}
2.  ADD_STEP: User wants to add a step to a workflow. (We'll define more entities later)
    - Entities: {"step_name": "Name of the step", "workflow_target": "Optional: Name of workflow to add to"}
3.  HELP: User wants to get help with a workflow.
    - Entities: {}
4.  UNKNOWN: If the intent is unclear or not one of the supported actions.
    - Entities: {}

Respond ONLY with a single JSON object containing "intent", "entities", and an optional "confidence" ("high", "medium", "low").
Example for creating a workflow: {"intent": "CREATE_WORKFLOW", "entities": {"workflow_name": "My New Report"}, "confidence": "high"}
Example for unknown: {"intent": "UNKNOWN", "entities": {}, "confidence": "low"}
`;

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

export interface IntentData {
  intent: 'CREATE_WORKFLOW' | 'ADD_STEP' | 'HELP' | 'UNKNOWN';
  entities: Record<string, string>;
  confidence: 'high' | 'medium' | 'low';
}

export interface ProbingResult {
  needsProbing: boolean;
  probingQuestion?: string;
  intentData?: IntentData;
}

export class IntentExtractor {
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
  }

  async extractIntent(userMessage: string): Promise<ProbingResult> {
    try {
      // If no API key, use mock responses
      if (!model) {
        const mockIntent = this.getMockIntent(userMessage);
        return this.checkProbingNeeded(mockIntent, userMessage);
      }

      // Construct the full prompt
      const fullPrompt = `${STRUCTURED_INTENT_SYSTEM_PROMPT}\n\nUser request: ${userMessage}`;
      console.log(`[CHAT_LOG] Sending to Gemini (Structured Intent): ${fullPrompt}`);

      // Call Gemini API
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const structuredGeminiResponse = response.text();

      console.log(`[CHAT_LOG] Raw Gemini Response (Structured Intent): ${structuredGeminiResponse}`);

      // Parse the response
      let parsedIntentData: IntentData;
      try {
        parsedIntentData = JSON.parse(structuredGeminiResponse);
      } catch (error) {
        console.error(`[CHAT_LOG] Error parsing Gemini JSON response: ${error}. Response was: ${structuredGeminiResponse}`);
        return this.checkProbingNeeded(this.getMockIntent(userMessage), userMessage);
      }

      // Validate the parsed data
      if (!this.isValidIntentData(parsedIntentData)) {
        console.error(`[CHAT_LOG] Invalid intent data structure: ${JSON.stringify(parsedIntentData)}`);
        return this.checkProbingNeeded(this.getMockIntent(userMessage), userMessage);
      }

      console.log(`[CHAT_LOG] Parsed Gemini Output: Intent='${parsedIntentData.intent}', Entities='${JSON.stringify(parsedIntentData.entities)}', Confidence='${parsedIntentData.confidence}'`);

      return this.checkProbingNeeded(parsedIntentData, userMessage);

    } catch (error) {
      console.error(`[CHAT_LOG] Error calling Gemini for structured intent: ${error}`);
      return this.checkProbingNeeded(this.getMockIntent(userMessage), userMessage);
    }
  }

  private async checkProbingNeeded(intentData: IntentData, userMessage: string): Promise<ProbingResult> {
    const needsProbing = (
      intentData.intent === 'UNKNOWN' ||
      intentData.confidence === 'low' ||
      (intentData.intent === 'CREATE_WORKFLOW' && !intentData.entities.workflow_name) ||
      (intentData.intent === 'ADD_STEP' && !intentData.entities.step_name)
    );

    console.log(`[CHAT_LOG] Needs Probing? ${needsProbing}. Intent: ${intentData.intent}, Confidence: ${intentData.confidence}, Entities: ${JSON.stringify(intentData.entities)}`);

    if (needsProbing) {
      try {
        const probingPrompt = PROBING_QUESTION_SYSTEM_PROMPT_TEMPLATE.replace("{ORIGINAL_USER_UTTERANCE}", userMessage);
        console.log(`[CHAT_LOG] Needs probing. Sending to Gemini (Probing Question): ${probingPrompt}`);

        if (!model) {
          // Mock probing question if no API key
          return {
            needsProbing: true,
            probingQuestion: this.getMockProbingQuestion(intentData),
            intentData
          };
        }

        const result = await model.generateContent(probingPrompt);
        const response = await result.response;
        const probingQuestion = response.text().trim();

        return {
          needsProbing: true,
          probingQuestion,
          intentData
        };
      } catch (error) {
        console.error(`[CHAT_LOG] Error getting probing question: ${error}`);
        return {
          needsProbing: true,
          probingQuestion: this.getMockProbingQuestion(intentData),
          intentData
        };
      }
    }

    console.log(`[CHAT_LOG] Intent is clear. Proceeding to action dispatch for intent: '${intentData.intent}'`);
    return {
      needsProbing: false,
      intentData
    };
  }

  private getMockProbingQuestion(intentData: IntentData): string {
    switch (intentData.intent) {
      case 'CREATE_WORKFLOW':
        return "What would you like to name your new workflow?";
      case 'ADD_STEP':
        return intentData.entities.step_name
          ? "Which workflow would you like to add this step to?"
          : "What kind of step would you like to add to your workflow?";
      default:
        return "How can I help you with workflows today?";
    }
  }

  private getMockIntent(userMessage: string): IntentData {
    // Simple mock implementation for testing
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('create') && lowerMessage.includes('workflow')) {
      const nameMatch = userMessage.match(/called\s+([^,.!?]+)/i);
      return {
        intent: 'CREATE_WORKFLOW',
        entities: {
          workflow_name: nameMatch ? nameMatch[1].trim() : ''
        },
        confidence: 'high'
      };
    }

    if (lowerMessage.includes('add') && lowerMessage.includes('step')) {
      const stepMatch = userMessage.match(/step\s+([^,.!?]+)/i);
      const workflowMatch = userMessage.match(/workflow\s+([^,.!?]+)/i);
      return {
        intent: 'ADD_STEP',
        entities: {
          step_name: stepMatch ? stepMatch[1].trim() : '',
          workflow_target: workflowMatch ? workflowMatch[1].trim() : ''
        },
        confidence: 'medium'
      };
    }

    return {
      intent: 'UNKNOWN',
      entities: {},
      confidence: 'low'
    };
  }

  private isValidIntentData(data: any): data is IntentData {
    return (
      typeof data === 'object' &&
      data !== null &&
      ['CREATE_WORKFLOW', 'ADD_STEP', 'HELP', 'UNKNOWN'].includes(data.intent) &&
      typeof data.entities === 'object' &&
      data.entities !== null &&
      ['high', 'medium', 'low'].includes(data.confidence)
    );
  }
}