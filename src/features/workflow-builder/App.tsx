import React from 'react';
// Corrected import path for ChatWidget:
import { ChatWidget } from './features/chatbot-gemini/components/ChatWidget';
// Import useWorkflowStore to display some workflow information
import { useWorkflowStore } from '@/features/chatbot-gemini/store/workflowStore';

function WFBuilderPage() {
  const { workflow } = useWorkflowStore();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AI Workflow Builder</h1>
      <p className="mb-4">
        Use the chat assistant (bottom-right) to design and build your workflows.
        The content below is for visualization and will be replaced or enhanced in future iterations.
      </p>

      {/* The ChatWidget is a floating button that opens an overlay.
          So, just including it in the tree makes it available. */}
      <ChatWidget />

      {/* Display some workflow data for context */}
      {workflow && (
        <div className="mt-6 p-4 border rounded-lg bg-muted">
          <h2 className="text-xl font-semibold mb-2">Current Workflow Overview</h2>
          <p className="text-sm">
            <span className="font-medium">Name:</span> {workflow.name || 'Untitled Workflow'}
          </p>
          <p className="text-sm">
            <span className="font-medium">Nodes:</span> {workflow.nodes?.length || 0}
          </p>
          <p className="text-sm">
            <span className="font-medium">Edges:</span> {workflow.edges?.length || 0}
          </p>
          {/* Basic visualization of nodes - this is a placeholder and can be removed/improved */}
          {workflow.nodes && workflow.nodes.length > 0 && (
            <div className="mt-2">
              <h3 className="text-md font-semibold">Nodes:</h3>
              <ul className="list-disc list-inside text-xs">
                {workflow.nodes.map(node => (
                  <li key={node.id}>{node.label} ({node.type})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!workflow && (
        <p className="mt-6 text-sm text-muted-foreground">
          No workflow active. Start by interacting with the chat assistant.
        </p>
      )}
    </div>
  );
}
export default WFBuilderPage;
