export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "1:4" | "1:8" | "4:1" | "8:1";
export type ImageSize = "512px" | "1K" | "2K" | "4K";

export type GenerationMode = "generic" | "cad_to_3d" | "su_render" | "furniture_swap";

export interface ImageInputRef {
  image: string; // base64
  type: "STRUCTURE" | "STYLE";
  strength: number; // 0 to 1
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt: string[];
  customNegativePrompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  guidanceScale: number;
  mode: GenerationMode;
  structureRef?: string; // base64
  structureStrength: number; // 0 to 1
  styleRef?: string; // base64
  styleStrength: number; // 0 to 1
  useGoogleSearch: boolean;
  useImageSearch: boolean;
}

export interface GenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  error?: string;
  params?: {
    structureStrength: number;
    styleStrength: number;
    guidanceScale: number;
  };
}

export interface HistoryItem {
  imageUrl: string;
  revisedPrompt?: string;
  params: {
    structureStrength: number;
    styleStrength: number;
    guidanceScale: number;
  };
}
