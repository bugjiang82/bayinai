export type NodeType = 'text' | 'image' | 'video' | 'drawing' | 'image-edit';

export interface NodeData {
  label: string;
  type: NodeType;
  prompt: string;
  output?: string;
  isGenerating?: boolean;
  config: {
    model: string;
    quality?: 'standard' | 'hd' | '4k' | '512p';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | '4:5' | '5:4' | '21:9' | '1:4' | '1:8' | '4:1' | '8:1';
    duration?: '3s' | '5s' | '10s';
    resolution?: '480P' | '720P' | '1080P' | '4k';
    wanxResolution?: '480P' | '720P' | '1080P';
    mode?: 't2v' | 'i2v' | 'f2f';
  };
  credits: number;
  sourceImage?: string;
  referencedParentIds?: string[];
  inheritImage?: string;
  inheritPrompt?: string;
  isUploaded?: boolean;
  error?: string;
  aspectRatio?: string | number;
  [key: string]: unknown;
}

export interface DraggingGroup {
  id: string;
  nodeIds: string[];
}