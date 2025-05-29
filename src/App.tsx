import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Save, Play, MessageCircle, Settings, Workflow, Trash2, Bot, GitBranch, User, Database, Zap } from 'lucide-react';
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { ChatWidget } from "@/features/chatbot-gemini/components/ChatWidget"
import { useWorkflowStore } from "@/features/chatbot-gemini/store/workflowStore"

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

interface WorkflowData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

const nodeTypes = [
  { type: 'trigger', label: 'Email Trigger', icon: Zap, color: 'bg-blue-100 border-blue-300' },
  { type: 'action', label: 'Send Message', icon: Bot, color: 'bg-green-100 border-green-300' },
  { type: 'condition', label: 'Check Status', icon: GitBranch, color: 'bg-yellow-100 border-yellow-300' },
  { type: 'agent', label: 'AI Agent', icon: Bot, color: 'bg-purple-100 border-purple-300' },
  { type: 'logic', label: 'Human Step', icon: User, color: 'bg-pink-100 border-pink-300' },
  { type: 'io', label: 'Database', icon: Database, color: 'bg-gray-100 border-gray-300' },
];

function App() {
  const [workflow, setWorkflow] = useState<WorkflowData>({
    id: 'demo-workflow',
    name: 'Demo Workflow',
    nodes: [],
    edges: []
  });
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const { workflow: generatedWorkflow } = useWorkflowStore();

  // Update workflow when generated workflow changes
  useEffect(() => {
    if (generatedWorkflow) {
      setWorkflow({
        id: 'demo-workflow',
        name: generatedWorkflow.name,
        nodes: generatedWorkflow.nodes,
        edges: generatedWorkflow.edges
      });
    }
  }, [generatedWorkflow]);

  const addNode = useCallback((type: Node['type'], label: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      label,
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50
      }
    };
    
    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => !selectedNodes.includes(n.id)),
      edges: prev.edges.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target))
    }));
    setSelectedNodes([]);
  }, [selectedNodes]);

  const connectNodes = useCallback(() => {
    if (selectedNodes.length === 2) {
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: selectedNodes[0],
        target: selectedNodes[1]
      };
      
      setWorkflow(prev => ({
        ...prev,
        edges: [...prev.edges, newEdge]
      }));
      setSelectedNodes([]);
    }
  }, [selectedNodes]);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 border-r bg-background p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Workflow className="mr-2 h-5 w-5" />
            Node Palette
          </h2>
          <div className="space-y-2">
            {nodeTypes.map(({ type, label, icon: Icon, color }) => (
              <Button
                key={type}
                variant="outline"
                className={`w-full justify-start ${color}`}
                onClick={() => addNode(type as Node['type'], label)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={workflow.name}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-semibold bg-transparent border-none outline-none"
                />
                <span className="text-sm text-muted-foreground">({workflow.nodes.length} nodes)</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedNodes}
                  disabled={selectedNodes.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={connectNodes}
                  disabled={selectedNodes.length !== 2}
                >
                  Connect
                </Button>
                <Button variant="default" size="sm">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div 
            className="flex-1 relative bg-muted/20 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedNodes([]);
              }
            }}
          >
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {workflow.edges.map(edge => {
                const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                const targetNode = workflow.nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.position.x + 75}
                    y1={sourceNode.position.y + 25}
                    x2={targetNode.position.x + 75}
                    y2={targetNode.position.y + 25}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {workflow.nodes.map(node => {
              const nodeType = nodeTypes.find(t => t.type === node.type);
              const isSelected = selectedNodes.includes(node.id);
              const Icon = nodeType?.icon || Bot;
              
              return (
                <div
                  key={node.id}
                  className={`absolute w-36 h-12 p-2 border rounded-lg bg-background shadow-md cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 'hover:shadow-lg'
                  } ${nodeType?.color}`}
                  style={{ left: node.position.x, top: node.position.y }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodes(prev => 
                      prev.includes(node.id) 
                        ? prev.filter(id => id !== node.id)
                        : [...prev, node.id]
                    );
                  }}
                >
                  <div className="flex items-center">
                    <Icon className="mr-1 h-4 w-4" />
                    <span className="text-xs font-medium truncate">{node.label}</span>
                  </div>
                  <div className="text-xxs text-muted-foreground capitalize">{node.type}</div>
                </div>
              );
            })}

            {/* Empty State */}
            {workflow.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Workflow className="mx-auto h-12 w-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">Start Building Your Workflow</p>
                  <p className="text-sm">Click nodes from the palette or use the AI assistant to create your workflow</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </Layout>
  );
}

export default App
