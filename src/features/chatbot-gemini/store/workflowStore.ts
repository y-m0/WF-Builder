import { create } from 'zustand';
import { generateWorkflow, type WorkflowConfig } from '../services/gemini';

interface WorkflowState {
  workflow: WorkflowConfig | null;
  isLoading: boolean;
  error: string | null;
  generateWorkflowFromPrompt: (prompt: string) => Promise<void>;
  setWorkflow: (workflow: WorkflowConfig) => void;
  clearError: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflow: null,
  isLoading: false,
  error: null,

  generateWorkflowFromPrompt: async (prompt: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await generateWorkflow(prompt);
      set({ workflow, isLoading: false });
    } catch (error) {
      console.error('Error generating workflow:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate workflow',
        isLoading: false,
        workflow: null
      });
    }
  },

  setWorkflow: (workflow: WorkflowConfig) => set({ workflow, error: null }),
  clearError: () => set({ error: null }),
})); 