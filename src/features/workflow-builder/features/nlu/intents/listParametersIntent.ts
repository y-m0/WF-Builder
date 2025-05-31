import { NLUResult } from '../nlu-types';

export function detectListParametersIntent(input: string): NLUResult | null {
  const listPattern = /list\s+(?:parameters|params|fields|inputs)/i;
  if (listPattern.test(input)) {
    return {
      intent: 'LIST_PARAMETERS',
      entities: [],
      confidence: 0.95,
    };
  }
  return null;
}