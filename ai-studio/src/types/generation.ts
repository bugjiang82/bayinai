// ==================== 生成参数类型 ====================

export interface GenerationParams {
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
  /** 推理步数 */
  steps?: number;
  /** CFG Scale / 引导系数 */
  cfgScale?: number;
  /** 随机种子 */
  seed?: number;
  /** 提示词引导强度 (图生图时使用) */
  strength?: number;
  /** 采样器 */
  sampler?: string;
  /** 视频时长（秒） */
  duration?: number;
  /** 帧率 */
  fps?: number;
  /** 采样数（渲染） */
  samples?: number;
  /** 是否降噪 */
  denoising?: boolean;
  /** 摄像机路径 */
  cameraPath?: string;
  /** 分辨率预设 */
  resolution?: string;
  /** 扩展参数 */
  [key: string]: unknown;
}

// ==================== 设计简报 ====================

export interface DesignBrief {
  /** 项目名称 */
  projectName?: string;
  /** 建筑类型 */
  buildingType?: string;
  /** 设计风格 */
  style?: string;
  /** 场景描述 */
  sceneDescription?: string;
  /** 材质偏好 */
  materials?: string[];
  /** 色彩倾向 */
  colorScheme?: string;
  /** 光照要求 */
  lighting?: string;
  /** 特殊要求 */
  specialRequirements?: string;
  /** 参考图片URL列表 */
  referenceImages?: string[];
}

// ==================== 选项卡片 ====================

export interface OptionCard {
  /** 选项唯一标识 */
  id: string;
  /** 选项标题 */
  label: string;
  /** 选项描述 */
  description?: string;
  /** 选项图标或缩略图 */
  icon?: string;
  /** 选项对应的值 */
  value: string;
  /** 是否选中 */
  selected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子选项 */
  children?: OptionCard[];
}

// ==================== 生成请求 ====================

export interface CreateGenerationRequest {
  /** 智能体ID */
  agentId?: string;
  /** 生成类型 */
  type: GenType;
  /** 正向提示词 */
  prompt: string;
  /** 反向提示词 */
  negativePrompt?: string;
  /** 生成参数 */
  params?: GenerationParams;
  /** 输入图片URL（图生图时使用） */
  inputUrl?: string;
  /** 设计简报 */
  designBrief?: DesignBrief;
}

// ==================== 生成类型枚举 ====================

export type GenType =
  | "TEXT_TO_IMAGE"
  | "IMAGE_TO_IMAGE"
  | "VIDEO"
  | "EDIT"
  | "INPAINT";

export type GenStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

// ==================== 生成结果 ====================

export interface GenerationResult {
  id: string;
  type: GenType;
  status: GenStatus;
  outputUrl?: string;
  thumbnailUrl?: string;
  errorMsg?: string;
  cost: number;
  createdAt: string;
  completedAt?: string;
}
