// ==================== 智能体配置 ====================

export interface AgentConfig {
  /** 默认生成参数 */
  defaultParams?: Record<string, unknown>;
  /** 每次生成消耗积分 */
  costPerGeneration?: number;
  /** 支持的风格列表 */
  supportedStyles?: string[];
  /** 支持的生成类型 */
  supportedTypes?: string[];
  /** 最大输入图片数量 */
  maxInputImages?: number;
  /** 最大输出尺寸 */
  maxResolution?: { width: number; height: number };
  /** 扩展配置 */
  [key: string]: unknown;
}

// ==================== 智能体信息 ====================

export interface AgentInfo {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt?: string;
  config: AgentConfig;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 智能体列表项 ====================

export interface AgentListItem {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  sortOrder: number;
  /** 使用次数（统计） */
  usageCount?: number;
}

// ==================== 智能体创建/更新 ====================

export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt: string;
  config?: AgentConfig;
  isPublic?: boolean;
  sortOrder?: number;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  avatar?: string;
  systemPrompt?: string;
  config?: AgentConfig;
  isPublic?: boolean;
  sortOrder?: number;
}

// ==================== 智能体对话消息 ====================

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** 关联的生成结果ID */
  generationId?: string;
  /** 关联的图片URL列表 */
  images?: string[];
  createdAt: string;
}

// ==================== 智能体会话 ====================

export interface AgentConversation {
  id: string;
  agentId: string;
  agent?: AgentListItem;
  title: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}
