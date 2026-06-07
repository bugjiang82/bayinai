import type { GenType, GenStatus } from "@/types/generation";

export interface GenerateTaskParams {
  userId: string;
  prompt: string;
  [key: string]: any;
}

export interface GenerateTaskResult {
  id: string;
  type: GenType;
  status: GenStatus;
  prompt: string;
  outputUrl?: string;
  outputBase64?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  cost: number;
  createdAt: string;
  completedAt?: string;
}

export interface GenerateService {
  execute(params: GenerateTaskParams): Promise<GenerateTaskResult>;
  getType(): GenType;
  getCost(model?: string, qualityOrResolution?: string): Promise<number>;
}
