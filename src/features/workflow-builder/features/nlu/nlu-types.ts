// NLU Intents
export type NLUIntent = 'CREATE_WORKFLOW' | 'ADD_TOOL' | 'LIST_PARAMETERS';

// NLU Entities
export interface NLUEntity {
  type: 'workflow_name' | 'tool_name';
  value: string;
}

// NLU Result
export interface NLUResult {
  intent: NLUIntent;
  entities: NLUEntity[];
  confidence: number;
}