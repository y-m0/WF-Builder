import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// System prompt to guide the AI in generating workflow configurations
const SYSTEM_PROMPT = `You are an AI assistant that helps users create workflows. 
Your task is to convert natural language descriptions into structured workflow configurations.
The workflow should be returned as a JSON object with the following structure:

{
  "name": "string",
  "nodes": [
    {
      "id": "string",
      "type": "trigger" | "action" | "condition" | "agent" | "logic" | "io",
      "label": "string",
      "position": { "x": number, "y": number }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string"
    }
  ]
}

Available node types:
- trigger: Starting points (e.g., form submissions, webhooks)
- action: Operations to perform (e.g., sending messages, updating data)
- condition: Decision points (e.g., if/else logic)
- agent: AI-powered steps
- logic: Human interaction steps
- io: Data operations (e.g., database operations)

Position nodes in a logical flow from left to right, with triggers on the left and final actions on the right.
Space nodes vertically to avoid overlap.`;

export interface WorkflowConfig {
  name: string;
  nodes: Array<{
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'agent' | 'logic' | 'io';
    label: string;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export async function generateWorkflow(prompt: string): Promise<WorkflowConfig> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `User request: ${prompt}\n\nGenerate a workflow configuration that satisfies this request.`
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the response');
    }

    const workflowConfig = JSON.parse(jsonMatch[0]) as WorkflowConfig;
    return workflowConfig;
  } catch (error) {
    console.error('Error generating workflow:', error);
    throw error;
  }
} 