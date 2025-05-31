import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWidget } from './ChatWidget'; // Adjusted path assuming test file is in the same directory

// Mock the stores
vi.mock('@/features/chatbot-gemini/store/workflowStore', () => ({
  useWorkflowStore: vi.fn(() => ({
    workflow: null,
    error: null,
    createWorkflowRequest: null,
    clearCreateWorkflowRequest: vi.fn(),
    addToolRequest: null,
    clearAddToolRequest: vi.fn(),
    // Add any other state/functions ChatWidget might use from this store
  }))
}));

vi.mock('@/features/dialogue/store/dialogueStore', () => ({
  // Note: The path for dialogueStore in ChatWidget.tsx is '@/features/dialogue/store/dialogueStore'
  // This mock path needs to match how Vitest resolves it based on the test file's location or tsconfig.
  // Assuming Vitest's resolver and tsconfig paths work correctly, this should be fine.
  // If issues arise, a relative path from the test file to the store might be needed for the mock,
  // or ensure Vitest's config correctly handles '@/' for mocks.
  // For this case, ChatWidget imports it as '@/features/dialogue/store/dialogueStore', so this mock path should be correct.
  useDialogueStore: vi.fn(() => ({
    isProcessing: false,
    error: null,
    currentIntent: null,
    waitingForWorkflowName: false,
    processUserInput: vi.fn(),
    // Add any other state/functions ChatWidget might use
  }))
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    MessageCircle: () => <svg data-testid="message-circle-icon" />,
    Send: () => <svg data-testid="send-icon" />,
    X: () => <svg data-testid="x-icon" />,
  };
});


describe('ChatWidget', () => {
  it('should render the chat toggle button', () => {
    render(<ChatWidget />);
    // The button itself doesn't have specific text, but it contains the MessageCircle icon.
    // We expect a button to be present. A more specific query would be better in a real scenario.
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();

    // Check if the MessageCircle icon (mocked) is rendered within the button or widget.
    // This depends on how the icon is rendered; if it's a direct child of the button, this could work.
    // For a more robust test, one might need to query within the button element.
    expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
  });
});
