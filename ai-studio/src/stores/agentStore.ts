import { create } from "zustand";

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  category: string;
  capabilities: string[];
  isPublic: boolean;
  createdAt: Date;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  createdAt: Date;
}

export type WorkflowStep =
  | "idle"
  | "analyzing"
  | "generating"
  | "refining"
  | "completed"
  | "failed";

export interface WorkflowState {
  currentStep: WorkflowStep;
  progress: number;
  message: string;
}

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  messages: AgentMessage[];
  workflowState: WorkflowState;

  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  setCurrentAgent: (agent: Agent | null) => void;
  addMessage: (message: AgentMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  setWorkflowState: (state: Partial<WorkflowState>) => void;
  resetWorkflow: () => void;
  reset: () => void;
}

const defaultWorkflowState: WorkflowState = {
  currentStep: "idle",
  progress: 0,
  message: "",
};

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  currentAgent: null,
  messages: [],
  workflowState: { ...defaultWorkflowState },

  setAgents: (agents) => set({ agents }),

  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),

  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      currentAgent:
        state.currentAgent?.id === id ? null : state.currentAgent,
    })),

  setCurrentAgent: (agent) =>
    set({
      currentAgent: agent,
      messages: [],
      workflowState: { ...defaultWorkflowState },
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  setWorkflowState: (state) =>
    set((prev) => ({
      workflowState: { ...prev.workflowState, ...state },
    })),

  resetWorkflow: () =>
    set({
      workflowState: { ...defaultWorkflowState },
    }),

  reset: () =>
    set({
      currentAgent: null,
      messages: [],
      workflowState: { ...defaultWorkflowState },
    }),
}));
