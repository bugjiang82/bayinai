export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  WAITING_FOR_USER = "waiting_for_user",
  FAILED = "failed",
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  agentId?: string;
  result?: string;
  imageUrl?: string; // 兼容旧版：单张图片
  imageUrls?: string[]; // 新版：多张图片
  reasoning?: string;
  progress: number;
}

export interface Agent {
  id: string;
  name: string;
  persona: string;
  capabilities: string[];
  status: "idle" | "busy" | "error";
  currentTaskId?: string;
}

export interface InteractionOption {
  id: string;
  label: string;
  value: any;
}

export interface InteractionCard {
  id: string;
  type: "choice" | "confirmation" | "input";
  prompt: string;
  options?: InteractionOption[];
  taskId: string;
}

export interface OrchestratorState {
  objective: string;
  currentStepIndex: number;
  tasks: SubTask[];
  agents: Agent[];
  interactions: InteractionCard[];
  logs: string[];
}