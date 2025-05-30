import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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
    // Construct the content for the new SDK
    // The new SDK expects `Contents` to be an array of `Content` objects.
    // Each `Content` object has `parts` (an array of `Part` objects) and an optional `role`.
    // For a simple user query with a system prompt, we can structure it like this:
    const contents = [
      // Part 1: System Prompt (treated as user input for this model type if no specific system role)
      { 
        role: "user", // Or omit role if it defaults to user for generateContent
        parts: [{ text: SYSTEM_PROMPT }] 
      },
      // Part 2: Actual User Request
      { 
        role: "user",
        parts: [{ text: `User request: ${prompt}\n\nGenerate a workflow configuration that satisfies this request.` }] 
      }
    ];

    // In the new SDK, generateContent is called on the `models` property of the GoogleGenAI instance.
    const result = await genAI.models.generateContent({
      model: "gemini-pro", // Specify model directly
      contents: contents,
      // generationConfig: { ... } // Optional: if specific generation parameters are needed
      // safetySettings: { ... }   // Optional: if specific safety settings are needed
    });

    // Accessing the response text
    // The new SDK's `GenerateContentResponse` object has a `text()` method.
    const response = result.response; 
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

export async function listAvailableModels() {
  if (!genAI) {
    console.error("Gemini AI client not initialized.");
    return;
  }
  try {
    console.log("Attempting to list available models with @google/genai SDK...");
    
    // Extensive comments about uncertainty regarding a direct listModels method in JS SDK v1.0.0.
    // The core of the message is to reflect the current state of knowledge.
    console.log(`Currently configured to use model: "gemini-pro" which translates to "models/gemini-pro" in API calls.`);
    console.log("Note: A direct model listing method in `@google/genai@1.0.0` JS SDK is not readily apparent from documentation snippets reviewed so far.");
    console.log("The API error message 'Call ListModels' might refer to a capability of the backend API accessible via other tools (like gcloud CLI) or newer/different SDK versions.");
    
    // Hypothetical example of what it *might* look like if a method existed and was found:
    /*
    const models = await genAI.models.list(); // Hypothetical, actual method name and object structure unknown
    console.log("Available models (if listing method was found and successful):");
    // Assuming 'models' is an iterable or array, and each 'model' has a 'name' property
    for await (const model of models) { // Use 'for await...of' if it's an async iterator
      console.log(\`- Name: ${model.name}\`); 
      // Add more properties if available and relevant, e.g., model.supportedGenerationMethods
      if (model.supportedGenerationMethods) {
         console.log(\`  Supported Methods: ${model.supportedGenerationMethods.join(", ")}\`);
      }
    }
    */
  } catch (error) {
    console.error("Error during model listing attempt (if a method was called):", error);
  }
}