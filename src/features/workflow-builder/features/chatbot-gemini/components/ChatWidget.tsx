import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from '@/features/chatbot-gemini/store/workflowStore';
import { useDialogueStore } from '@/features/dialogue/store/dialogueStore';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const SAMPLE_PROMPTS = [
  "Create a workflow that sends a Slack alert when a Google Form is submitted",
  "Build a workflow that processes new GitHub issues and assigns them to team members",
  "Make a workflow that syncs new contacts from HubSpot to Salesforce",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { workflow, error: workflowError } = useWorkflowStore();
  const {
    processUserInput,
    isProcessing,
    error: dialogueError,
    currentIntent,
    waitingForWorkflowName
  } = useDialogueStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      await processUserInput(input);

      let assistantMessage: Message;

      if (dialogueError) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${dialogueError}`,
          role: 'assistant',
          timestamp: new Date(),
        };
      } else if (waitingForWorkflowName) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          content: "I'll create a workflow with that name. What would you like this workflow to do?",
          role: 'assistant',
          timestamp: new Date(),
        };
      } else if (currentIntent === 'CREATE_WORKFLOW') {
        if (workflow) {
          assistantMessage = {
            id: (Date.now() + 1).toString(),
            content: `I've created a workflow named "${workflow.name}" with ${workflow.nodes.length} nodes. You can now review and modify it on the canvas.`,
            role: 'assistant',
            timestamp: new Date(),
          };
        } else {
          assistantMessage = {
            id: (Date.now() + 1).toString(),
            content: "What would you like to name your workflow?",
            role: 'assistant',
            timestamp: new Date(),
          };
        }
      } else {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          content: "I'm not sure what you'd like to do. Could you please rephrase your request?",
          role: 'assistant',
          timestamp: new Date(),
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">AI Workflow Assistant</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Hi! I can help you create workflows using natural language. Try asking me to:
                </p>
                <div className="space-y-2">
                  {SAMPLE_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 text-sm bg-muted/50 rounded-md hover:bg-muted transition-colors"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={waitingForWorkflowName ? "Enter workflow name..." : "Describe your workflow..."}
                className="flex-1 px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}