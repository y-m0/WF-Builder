import { NLUResult } from '../nlu/nlu-types';
import { DialogueResult, DialogueState, DialogueContext } from './dialogue-types';

export function dialogueManager(
  nlu: NLUResult | null,
  prevState: DialogueState = 'IDLE',
  prevContext: DialogueContext = {}
): DialogueResult {
  if (!nlu) {
    return {
      state: 'IDLE',
      context: prevContext,
      action: { type: 'NONE' },
      message: "I'm sorry, I didn't understand."
    };
  }

  if (nlu.intent === 'CREATE_WORKFLOW') {
    const nameEntity = nlu.entities.find(e => e.type === 'workflow_name');
    if (nameEntity && nameEntity.value) {
      return {
        state: 'COMPLETE',
        context: { workflowName: nameEntity.value },
        action: { type: 'CREATE_WORKFLOW', payload: { name: nameEntity.value } },
        message: `Creating workflow named '${nameEntity.value}'.`
      };
    } else {
      return {
        state: 'AWAITING_WORKFLOW_NAME',
        context: prevContext,
        action: { type: 'PROMPT_FOR_WORKFLOW_NAME' },
        message: 'What would you like to name your workflow?'
      };
    }
  }

  if (nlu.intent === 'ADD_TOOL') {
    const toolEntity = nlu.entities.find(e => e.type === 'tool_name');
    if (toolEntity && toolEntity.value) {
      return {
        state: 'COMPLETE',
        context: { ...prevContext, toolName: toolEntity.value },
        action: { type: 'ADD_TOOL', payload: { name: toolEntity.value } },
        message: `Adding tool '${toolEntity.value}' to the workflow.`
      };
    } else {
      return {
        state: 'AWAITING_TOOL_NAME',
        context: prevContext,
        action: { type: 'PROMPT_FOR_TOOL_NAME' },
        message: 'Which tool would you like to add?'
      };
    }
  }

  if (nlu.intent === 'LIST_PARAMETERS') {
    return {
      state: 'COMPLETE',
      context: prevContext,
      action: { type: 'NONE' },
      message: 'Listing parameters is not supported yet, but this feature is coming soon!'
    };
  }

  // If in AWAITING_WORKFLOW_NAME and user provides a name
  if (prevState === 'AWAITING_WORKFLOW_NAME' && nlu.entities.length > 0) {
    const nameEntity = nlu.entities.find(e => e.type === 'workflow_name');
    if (nameEntity && nameEntity.value) {
      return {
        state: 'COMPLETE',
        context: { workflowName: nameEntity.value },
        action: { type: 'CREATE_WORKFLOW', payload: { name: nameEntity.value } },
        message: `Creating workflow named '${nameEntity.value}'.`
      };
    }
  }

  // If in AWAITING_TOOL_NAME and user provides a tool name
  if (prevState === 'AWAITING_TOOL_NAME' && nlu.entities.length > 0) {
    const toolEntity = nlu.entities.find(e => e.type === 'tool_name');
    if (toolEntity && toolEntity.value) {
      return {
        state: 'COMPLETE',
        context: { ...prevContext, toolName: toolEntity.value },
        action: { type: 'ADD_TOOL', payload: { name: toolEntity.value } },
        message: `Adding tool '${toolEntity.value}' to the workflow.`
      };
    }
  }

  return {
    state: prevState,
    context: prevContext,
    action: { type: 'NONE' },
    message: undefined
  };
}