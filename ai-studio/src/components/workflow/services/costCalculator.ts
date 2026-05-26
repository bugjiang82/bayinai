import {
  type ImageModelId,
  type ImageQuality,
  type VideoModelId,
  type VideoResolution,
  getImageModelIdByApiId,
} from '@/models';
import type { NodeData } from '../types';

export function calculateNodeCost(
  data: NodeData,
  getImageCost: (modelId: ImageModelId, quality: ImageQuality) => number,
  getVideoCost: (modelId: VideoModelId, resolution: VideoResolution, duration?: number) => number,
): number {
  const model = data.config.model || 'gemini-3.1-flash-image-preview';

  if (data.type === 'video') {
    const modelId = model as VideoModelId;
    const resolution = (data.config.wanxResolution || '720P') as VideoResolution;
    const duration = Number(data.config.duration?.replace('s', '') || 5);
    return getVideoCost(modelId, resolution, duration);
  }

  const modelId = getImageModelIdByApiId(model) || ('flash' as ImageModelId);

  const qualityMap: Record<string, ImageQuality> = {
    '512p': '512',
    standard: '1K',
    hd: '2K',
    '4k': '4K',
  };

  const quality = qualityMap[data.config.quality || 'standard'] || '1K';

  return getImageCost(modelId, quality);
}