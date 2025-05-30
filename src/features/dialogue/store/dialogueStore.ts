import { create } from 'zustand';
import { NLUResult, NLUIntent } from '@/features/nlu/nlu-types';
import { useWorkflowStore } from '@/features/chatbot-gemini/store/workflowStore';

interface DialogueState {
  currentIntent: NLUIntent | null;
  isProcessing: boolean;
  error: string | null;
  waitingForWorkflowName: boolean;
  processUserInput: (input: string) => Promise<void>;
  clearError: () => void;
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  currentIntent: null,
  isProcessing: false,
  error: null,
  waitingForWorkflowName: false,

  processUserInput: async (input: string) => {
    set({ isProcessing: true, error: null });
    try {
      const state = get();
      
      // If we're waiting for a workflow name, treat the input as the name
      if (state.waitingForWorkflowName) {
        useWorkflowStore.getState().triggerCreateWorkflow(input);
        set({ waitingForWorkflowName: false, currentIntent: null });
        return;
      }

      // TODO: Replace with actual NLU processing
      // For now, we'll use a simple keyword-based approach
      const lowerInput = input.toLowerCase();
      let intent: NLUIntent | null = null;
      let workflowName: string | null = null;

      // Check for workflow creation intent
      if (
        lowerInput.includes('create') || 
        lowerInput.includes('make') || 
        lowerInput.includes('build') || 
        lowerInput.includes('set up')
      ) {
        if (
          lowerInput.includes('workflow') || 
          lowerInput.includes('automation') || 
          lowerInput.includes('process')
        ) {
          intent = 'CREATE_WORKFLOW';
          // Extract workflow name if present
          const nameMatch = input.match(/(?:workflow|automation|process) (?:called|named|for)? "?([^"]+)"?/i);
          if (nameMatch) {
            workflowName = nameMatch[1];
          }
        }
      }

      set({ currentIntent: intent });

      // Handle the intent
      if (intent === 'CREATE_WORKFLOW') {
        if (workflowName) {
          useWorkflowStore.getState().triggerCreateWorkflow(workflowName);
        } else {
          // If no name provided, set flag to wait for name
          set({ waitingForWorkflowName: true });
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isProcessing: false });
    }
  },

  clearError: () => set({ error: null }),
})); 