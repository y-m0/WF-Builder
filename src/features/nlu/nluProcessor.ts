import { NLUResult } from './nlu-types';
import { detectCreateWorkflowIntent } from './intents/createWorkflowIntent';
import { detectAddToolIntent } from './intents/addToolIntent';
import { detectListParametersIntent } from './intents/listParametersIntent';

export function processNLU(input: string): NLUResult | null {
  // Try LIST_PARAMETERS first
  const listParams = detectListParametersIntent(input);
  if (listParams) return listParams;
  // Then ADD_TOOL
  const addTool = detectAddToolIntent(input);
  if (addTool) return addTool;
  // Then CREATE_WORKFLOW
  return detectCreateWorkflowIntent(input);
} 