import { create } from 'zustand';

interface DialogueState {
  isProcessing: boolean;
  error: string | null;
  currentIntent: string | null;
  waitingForWorkflowName: boolean;
  processUserInput: (input: string) => Promise<void>;
  setError: (error: string | null) => void;
  setCurrentIntent: (intent: string | null) => void;
  setWaitingForWorkflowName: (waiting: boolean) => void;
}

export const useDialogueStore = create<DialogueState>((set) => ({
  isProcessing: false,
  error: null,
  currentIntent: null,
  waitingForWorkflowName: false,

  processUserInput: async (input: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId: 'user-1', // TODO: Get from auth
          sessionId: 'session-1', // TODO: Generate unique session ID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.messageForUser || 'Failed to process message');
      }

      set({
        currentIntent: data.intent || null,
        waitingForWorkflowName: data.status === 'clarification_needed',
        isProcessing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        isProcessing: false,
      });
    }
  },

  setError: (error) => set({ error }),
  setCurrentIntent: (intent) => set({ currentIntent: intent }),
  setWaitingForWorkflowName: (waiting) => set({ waitingForWorkflowName: waiting }),
}));