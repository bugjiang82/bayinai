export type NodeType = 'text' | 'image' | 'video' | 'drawing';

export interface NodeData {
  label: string;
  type: NodeType;
  prompt: string;
  output?: string;
  isGenerating?: boolean;
  config: {
    model: string;
    quality?: 'standard' | 'hd';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    duration?: '5s' | '10s';
    mode?: 't2v' | 'i2v' | 'f2f';
  };
  credits: number;
  sourceImage?: string;
  [key: string]: unknown;
}

export interface DraggingGroup {
  id: string;
  nodeIds: string[];
}
