'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { NodeProps, useReactFlow, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../types';
import { generateVideo, checkVideoStatus } from '../services/aiService';
import { Video, Film, PlayCircle, RefreshCw, Layers, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

// 模型配置
const MODEL_CONFIG: Record<string, {
  label: string;
  costPerSecond: number;
  resolutions: string[];
  durations: string[];
  supportImageToVideo: boolean;
}> = {
  "wan2.7-r2v": {
    label: "万相 2.7",
    costPerSecond: 50,
    resolutions: ['720P', '1080P'],
    durations: ['5s', '10s', '15s'],
    supportImageToVideo: true,
  },
  "wan2.7-t2v": {
    label: "万相 2.7",
    costPerSecond: 50,
    resolutions: ['720P', '1080P'],
    durations: ['5s', '10s', '15s'],
    supportImageToVideo: false,
  },
  "wan2.2-kf2v-flash": {
    label: "万相 2.2",
    costPerSecond: 50,
    resolutions: ['480P', '720P', '1080P'],
    durations: ['3s', '5s', '10s'],
    supportImageToVideo: true,
  },
  "veo-3.1-lite-generate-preview": {
    label: "Veo 3.1",
    costPerSecond: 50,
    resolutions: ['720P'],
    durations: ['5s', '10s'],
    supportImageToVideo: false,
  },
};

// 计算积分消耗
const calculateCost = (data: NodeData): number => {
  const modelKey = data.config.model || "wan2.2-kf2v-flash";
  const config = MODEL_CONFIG[modelKey] || MODEL_CONFIG["wan2.2-kf2v-flash"];

  if (data.type === "video") {
    const duration = Number(data.config.duration?.replace("s", "") || 5);
    return duration * config.costPerSecond;
  }

  return config.costPerSecond;
};

export const VideoNode: React.FC<NodeProps<Node<NodeData>>> = (props) => {
  const { setNodes, getNodes } = useReactFlow<Node<NodeData>>();
  const data = props.data;
  const [progress, setProgress] = useState(0);
  
  // 计算积分消耗
  const cost = useMemo(() => calculateCost(data), [data.config.model, data.config.duration, data.type]);

  const handleGenerate = async () => {
    if (data.isGenerating || data.credits < cost) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, isGenerating: true, error: undefined, taskId: undefined } } : n
      )
    );
    
    // 重置进度
    setProgress(0);
    
    try {
      // 获取上级节点的图片数据
      const parentIds = (data.referencedParentIds || []) as string[];
      const parentNodes = parentIds
        .map(parentId => getNodes().find(n => n.id === parentId))
        .filter((n): n is Node<NodeData> => !!n);
      
      // 筛选出有图片输出的节点
      const imageParentNodes = parentNodes.filter(n => 
        (n.data.output || n.data.sourceImage) && (n.type === 'image' || n.type === 'image-edit')
      );
      
      console.log("VideoNode: Found", imageParentNodes.length, "image parent nodes");
      
      let firstFrame: string | undefined;
      let lastFrame: string | undefined;
      let referenceImage: string | undefined;
      
      if (imageParentNodes.length >= 1) {
        firstFrame = (imageParentNodes[0].data.output || imageParentNodes[0].data.sourceImage) as string;
        console.log("VideoNode: Using first frame from", imageParentNodes[0].id);
      }
      
      if (imageParentNodes.length >= 2) {
        lastFrame = (imageParentNodes[1].data.output || imageParentNodes[1].data.sourceImage) as string;
        console.log("VideoNode: Using last frame from", imageParentNodes[1].id);
      }
      
      // 也检查旧的 inheritImage 和 sourceImage
      if (!firstFrame && (data.inheritImage || data.sourceImage)) {
        referenceImage = data.inheritImage || data.sourceImage;
        console.log("VideoNode: Using reference image");
      }
      
      // 提交视频生成任务
      const result = await generateVideo(data.prompt || "", {
        aspectRatio: data.config.aspectRatio || "16:9",
        resolution: data.config.wanxResolution || "720P",
        duration: Number(data.config.duration?.replace("s", "") || 5),
        model: data.config.model || "wan2.2-kf2v-flash",
        referenceImage: referenceImage,
        firstFrame: firstFrame,
        lastFrame: lastFrame,
        cost: cost,
      });

      // 更新节点数据，保存 taskId
      setNodes((nds) =>
        nds.map((n) =>
          n.id === props.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  isGenerating: true,
                  taskId: result.task_id,
                },
              }
            : n
        )
      );
      
      // 开始进度动画
      setProgress(5);

      // 开始轮询视频状态
      pollVideoStatus(props.id, result.task_id);
    } catch (error) {
      console.error("Video generation error:", error);
      setProgress(0);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === props.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  isGenerating: false,
                  error: error instanceof Error ? error.message : "视频生成失败",
                },
              }
            : n
        )
      );
    }
  };

  // 视频状态轮询
  const pollVideoStatus = async (nodeId: string, taskId: string) => {
    const poll = async () => {
      try {
        const result = await checkVideoStatus(taskId);
        
        // 更新进度
        setProgress(result.progress || 0);

        if (result.status === "SUCCEEDED") {
          setProgress(100);
          // 短暂延迟后显示视频
          setTimeout(() => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        isGenerating: false,
                        output: result.video_url,
                        credits: Math.max(0, n.data.credits - cost),
                      },
                    }
                  : n
              )
            );
            setTimeout(() => setProgress(0), 500);
          }, 300);
        } else if (result.status === "FAILED") {
          setProgress(0);
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      isGenerating: false,
                      error: "视频生成失败",
                    },
                  }
                : n
            )
          );
        } else {
          // 继续轮询
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error("Polling error:", error);
        // 出错后继续轮询
        setTimeout(poll, 3000);
      }
    };
    
    poll();
  };

  // 配置项更新
  const updateConfig = (update: Partial<NodeData['config']>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...update } } } : n
      )
    );
  };

  // 动态宽度计算
  const getDynamicWidth = () => {
    if (!data.aspectRatio) return '260px';
    let ratio: number;
    if (typeof data.aspectRatio === 'number') {
      ratio = data.aspectRatio;
    } else {
      const parts = data.aspectRatio.includes('/') 
        ? data.aspectRatio.split('/') 
        : data.aspectRatio.split(':');
      
      if (parts.length === 2) {
        ratio = Number(parts[0]) / Number(parts[1]);
      } else {
        ratio = 16 / 9;
      }
    }
    
    if (ratio < 0.7) return '160px';
    if (ratio < 1) return '200px';
    if (ratio === 1) return '220px';
    if (ratio < 1.8) return '260px';
    return '300px';
  };

  const nodeWidth = getDynamicWidth();

  const currentModel = data.config.model || "wan2.2-kf2v-flash";
  const currentConfig = MODEL_CONFIG[currentModel] || MODEL_CONFIG["wan2.2-kf2v-flash"];
  const currentResolutions = currentConfig.resolutions;
  const currentDurations = currentConfig.durations;

  const handleModelChange = (model: string) => {
    const newConfig = MODEL_CONFIG[model] || MODEL_CONFIG["wan2.2-kf2v-flash"];
    let updates: Partial<NodeData['config']> = { model };

    if (!newConfig.resolutions.includes(data.config.wanxResolution || "720P")) {
      updates.wanxResolution = newConfig.resolutions[0] as '480P' | '720P' | '1080P';
    }
    if (!newConfig.durations.includes(data.config.duration || "5s")) {
      updates.duration = newConfig.durations[0] as '3s' | '5s' | '10s' | '15s';
    }

    updateConfig(updates);
  };

  return (
    <BaseNode
      {...props}
      onGenerate={handleGenerate}
      renderConfig={() => (
        <div className="relative group/config">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all text-slate-400 hover:text-white group">
            <Layers size={16} className="text-slate-500" />
            <span className="text-sm font-bold uppercase tracking-tight">
              {currentConfig.label} · {data.config.wanxResolution || '720P'} · {data.config.duration || '5s'}
            </span>
          </button>

          <div className="absolute bottom-full right-0 mb-4 w-[280px] bg-[#1a1c24] border border-white/10 rounded-3xl shadow-2xl scale-0 group-hover/config:scale-100 transition-all origin-bottom-right z-[500] overflow-hidden backdrop-blur-xl text-left p-5 space-y-5">
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-500 pl-1 uppercase tracking-wider">分辨率</div>
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                {currentResolutions.map((res) => (
                  <button
                    key={res}
                    onClick={() => updateConfig({ wanxResolution: res as '480P' | '720P' | '1080P' })}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase transition-all rounded-xl",
                      (data.config.wanxResolution === res || (!data.config.wanxResolution && res === "720P"))
                        ? "bg-white/10 text-white shadow-xl"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-500 pl-1 uppercase tracking-wider">时长</div>
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                {currentDurations.map((dur) => (
                  <button
                    key={dur}
                    onClick={() => updateConfig({ duration: dur as '3s' | '5s' | '10s' | '15s' })}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase transition-all rounded-xl",
                      (data.config.duration === dur || (!data.config.duration && dur === "5s"))
                        ? "bg-white/10 text-white shadow-xl"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <div className="relative">
        <div 
          className="bg-black relative group/video overflow-hidden rounded-xl transition-all"
          style={{ 
            width: nodeWidth,
            aspectRatio: data.aspectRatio
              ? typeof data.aspectRatio === 'number' 
                ? data.aspectRatio 
                : data.aspectRatio.replace(':', '/') 
              : '16/9',
          }}
        >
          {data.output ? (
            <video
              src={data.output}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {data.isGenerating ? (
            <div className="flex flex-col items-center space-y-3">
              {/* 生成中 */}
              <RefreshCw size={48} className="animate-spin text-indigo-500/70" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">生成中...</span>
            </div>
          ) : data.error ? (
            <div className="text-center space-y-2">
              <Zap size={48} className="text-red-500/50 mx-auto" />
              <div className="text-[10px] text-red-500/70 font-medium max-w-[120px] line-clamp-3">
                {data.error}
              </div>
            </div>
          ) : (
            <>
              <Film size={48} className="mb-2 text-white/10" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10">
                {(() => {
                  const parentIds = (data.referencedParentIds || []) as string[];
                  // 只是简单估计
                  if (data.inheritImage || data.sourceImage) return "I2V Mode";
                  return "T2V Mode";
                })()}
              </span>
            </>
          )}
            </div>
          )}
          {data.output && (
            <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover/video:opacity-100 transition-all flex items-center justify-center">
              <PlayCircle size={48} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
};
