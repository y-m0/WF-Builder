import { create } from 'zustand';
import { generateWorkflow, type WorkflowConfig } from '../services/gemini';

interface CreateWorkflowRequest {
  name: string;
}

interface AddToolRequest {
  name: string;
}

interface WorkflowState {
  workflow: WorkflowConfig | null;
  isLoading: boolean;
  error: string | null;
  createWorkflowRequest: CreateWorkflowRequest | null;
  addToolRequest: AddToolRequest | null;
  generateWorkflowFromPrompt: (prompt: string) => Promise<void>;
  setWorkflow: (workflow: WorkflowConfig) => void;
  clearError: () => void;
  triggerCreateWorkflow: (name: string) => void;
  clearCreateWorkflowRequest: () => void;
  triggerAddTool: (name: string) => void;
  clearAddToolRequest: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflow: null,
  isLoading: false,
  error: null,
  createWorkflowRequest: null,
  addToolRequest: null,

  generateWorkflowFromPrompt: async (prompt: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await generateWorkflow(prompt);
      set({ workflow, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate workflow',
        isLoading: false 
      });
    }
  },

  setWorkflow: (workflow: WorkflowConfig) => {
    set({ workflow });
  },

  clearError: () => set({ error: null }),

  triggerCreateWorkflow: (name: string) => {
    set({ createWorkflowRequest: { name } });
  },

  clearCreateWorkflowRequest: () => {
    set({ createWorkflowRequest: null });
  },

  triggerAddTool: (name: string) => {
    set({ addToolRequest: { name } });
  },

  clearAddToolRequest: () => {
    set({ addToolRequest: null });
  },
})); 