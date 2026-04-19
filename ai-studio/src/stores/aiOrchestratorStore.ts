import { create } from 'zustand';
import { SubTask, Agent, InteractionCard, OrchestratorState, TaskStatus } from '@/types/ai-agent';

interface StoreState extends OrchestratorState {
  isInitializing: boolean;
  isExecuting: boolean;
  isPaused: boolean;
  focusedTaskId: string | null;

  setObjective: (objective: string) => void;
  setInitializing: (val: boolean) => void;
  setExecuting: (val: boolean) => void;
  setPaused: (val: boolean) => void;
  setFocusedTaskId: (id: string | null) => void;
  initializeSystem: (tasks: SubTask[], agents: Agent[]) => void;
  updateTask: (id: string, updates: Partial<SubTask>) => void;
  setCurrentStep: (index: number) => void;
  addInteraction: (interaction: InteractionCard) => void;
  clearInteractions: () => void;
  addLog: (message: string) => void;
  reset: () => void;
}

export const useAIOrchestratorStore = create<StoreState>((set) => ({
  objective: "",
  currentStepIndex: -1,
  tasks: [],
  agents: [],
  interactions: [],
  logs: [],
  isInitializing: false,
  isExecuting: false,
  isPaused: false,
  focusedTaskId: null,

  setObjective: (objective) => set({ objective }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setPaused: (isPaused) => set({ isPaused }),
  setFocusedTaskId: (focusedTaskId) => set({ focusedTaskId }),

  initializeSystem: (tasks, agents) => set({
    tasks,
    agents,
    currentStepIndex: 0,
    focusedTaskId: tasks[0]?.id || null,
    interactions: [],
    logs: [`[${new Date().toLocaleTimeString()}] System initialized with ${tasks.length} tasks.`]
  }),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  setCurrentStep: (currentStepIndex) => set({ currentStepIndex }),

  addInteraction: (interaction) => set((state) => ({
    interactions: [...state.interactions, interaction]
  })),

  clearInteractions: () => set({ interactions: [] }),

  addLog: (message) => set((state) => ({
    logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
  })),

  reset: () => set({
    objective: "",
    currentStepIndex: -1,
    tasks: [],
    agents: [],
    interactions: [],
    logs: [],
    isInitializing: false,
    isExecuting: false,
    isPaused: false,
    focusedTaskId: null,
  }),
}));