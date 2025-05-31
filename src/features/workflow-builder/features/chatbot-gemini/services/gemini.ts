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
      model: "gemini-2.0-flash", // Specify model directly
      contents: contents,
      // generationConfig: { ... } // Optional: if specific generation parameters are needed
      // safetySettings: { ... }   // Optional: if specific safety settings are needed
    });

    // Accessing the response text
    // The new SDK's `GenerateContentResponse` object has a `candidates` array, each with a `content` property.
    const candidate = result.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error('No valid response candidate found');
    }
    // Concatenate all text parts
    const text = candidate.content.parts.map((part: any) => part.text).join('');

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
  try {
    console.log("Attempting to list available models with @google/genai SDK...");
    // The new SDK's `GoogleGenAI` instance has a `models` property,
    // which is expected to have a `list` method based on Python examples (client.models.list()).
    // This returns an iterable or array of model information.
    // Note: The actual method might be an async iterator or return a promise resolving to an array.
    // The exact structure of `modelInfo` objects needs to be inferred or checked from docs if this runs.

    // Based on Python client.models.list() which returns an iterable of Model objects.
    // Each Model object has attributes like 'name', 'supported_generation_methods'
    // Let's assume a similar structure for JS/TS.
    // The `list` method itself might be paginated in more complex scenarios, but for now,
    // we'll assume it returns something directly iterable or an array.

    // The `list` method is not directly documented with JS examples in the migration guide,
    // but is a logical counterpart to Python's `client.models.list()`.
    // If this specific method name is incorrect, an error will occur,
    // and it might need adjustment based on the actual SDK API for v1.0.0.

    // Placeholder for the actual listing.
    // The `genAI.models` object is a `GenerativeModelService`.
    // There isn't a direct `list()` method on `GenerativeModelService` in the typings for 1.0.0.
    // Listing models might be done differently, perhaps via a different service or it's not exposed at this level.
    // The migration guide showed Python `client.models.list()`.
    // Let's check common locations or if it's a top-level method on `genAI` itself.
    // Re-checking documentation for `@google/genai` for listing models is needed if this fails.
    // For now, I will comment this out as its existence and precise usage in JS 1.0.0 is not certain from current docs.
    /*
    const models = await genAI.models.list(); // This is a guess
    console.log("Available models:");
    for (const model of models) { // Assuming it's an array or iterable
      console.log(`- Name: ${model.name}`);
      if (model.supportedGenerationMethods) {
        console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(", ")}`);
      }
    }
    */
    console.log("Model listing functionality (`genAI.models.list()`) needs to be verified for the @google/genai JS SDK v1.0.0.");
    console.log("The Python SDK uses `client.models.list()`. The JS equivalent is not explicitly shown in basic guides.");
    console.log("For now, this function serves as a placeholder for where model listing would be implemented.");

  } catch (error) {
    console.error("Error attempting to list models:", error);
    // It's possible the method doesn't exist or API key doesn't have permissions if it's a permission error.
  }
}