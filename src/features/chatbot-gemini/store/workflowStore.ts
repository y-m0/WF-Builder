import { create } from 'zustand';

interface Node {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'agent' | 'logic' | 'io';
  label: string;
  position: { x: number; y: number };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface WorkflowState {
  workflow: {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
  } | null;
  createWorkflowRequest: { name: string } | null;
  addToolRequest: { name: string } | null;
  setWorkflow: (workflow: WorkflowState['workflow']) => void;
  createWorkflow: (name: string) => void;
  addTool: (name: string) => void;
  clearCreateWorkflowRequest: () => void;
  clearAddToolRequest: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflow: null,
  createWorkflowRequest: null,
  addToolRequest: null,
  setWorkflow: (workflow) => set({ workflow }),
  createWorkflow: (name) => set({ createWorkflowRequest: { name } }),
  addTool: (name) => set({ addToolRequest: { name } }),
  clearCreateWorkflowRequest: () => set({ createWorkflowRequest: null }),
  clearAddToolRequest: () => set({ addToolRequest: null }),
})); 