import { NLUResult } from '../nlu-types';

export function detectAddToolIntent(input: string): NLUResult | null {
  const addPattern = /(?:add|insert|include)\s+(?:tool|node|step)?\s*([\w\s-]+)/i;
  const match = input.match(addPattern);
  if (match) {
    const name = match[1]?.trim();
    return {
      intent: 'ADD_TOOL',
      entities: name ? [{ type: 'tool_name', value: name }] : [],
      confidence: 0.95,
    };
  }
  return null;
} 