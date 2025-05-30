import { NLUResult } from './nlu-types';

// Simple regex-based intent and entity extraction for demo
export function detectCreateWorkflowIntent(input: string): NLUResult | null {
  const createPattern = /(?:create|new|start)\s+(?:workflow|flow)(?:\s+named?\s+([\w\s-]+))?/i;
  const match = input.match(createPattern);
  if (match) {
    const name = match[1]?.trim();
    return {
      intent: 'CREATE_WORKFLOW',
      entities: name ? [{ type: 'workflow_name', value: name }] : [],
      confidence: 0.95,
    };
  }
  return null;
} 