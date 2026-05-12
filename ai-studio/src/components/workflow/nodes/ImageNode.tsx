'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { NodeProps, useReactFlow, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../types';
import { generateImage } from '../services/aiService';
import { ImageIcon, Layout, Zap, Monitor, Smartphone, Square, RefreshCw, Upload, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type CreditPolicies = Record<string, { cost: number; unit: string }>;

export const ImageNode: React.FC<NodeProps<Node<NodeData>>> = (props) => {
  const { setNodes, getNodes } = useReactFlow<Node<NodeData>>();
  const data = props.data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [creditPolicies, setCreditPolicies] = useState<CreditPolicies>({});

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch("/api/credits/policies");
        const json = await res.json();
        if (json.success && json.data) {
          setCreditPolicies(json.data);
        }
      } catch {
        // 忽略错误，使用默认积分
      }
    };
    fetchPolicies();
  }, []);

  const getCost = useMemo(() => {
    return (model: string): number => {
      const policyKey = `text-to-image-${model}`;
      if (creditPolicies[policyKey]) {
        return creditPolicies[policyKey].cost;
      }
      const defaultCosts: Record<string, number> = {
        flash: 1,
        pro: 3,
        image2: 50,
      };
      const modelCost = defaultCosts[model] || 1;
      if (model === "image2" && data.config.n) {
        return modelCost * data.config.n;
      }
      return modelCost;
    };
  }, [creditPolicies, data.config.n]);

  const cost = useMemo(() => getCost(data.config.model || 'flash'), [data.config.model, getCost]);

  const handleGenerate = async () => {
    if (data.isGenerating || data.credits < cost) return;

    let resolvedPrompt = data.prompt;
    const nodes = getNodes(); 
    
    const parentIds = (data.referencedParentIds || []) as string[];
    const referencedNodes = parentIds
      .map(id => nodes.find(n => n.id === id))
      .filter((n): n is Node<NodeData> => !!n && (!!n.data.output || !!n.data.sourceImage));

    // 先设置生成状态，重置错误
    setNodes((nds) => 
      nds.map((n) => 
        n.id === props.id 
          ? { ...n, data: { ...n.data, isGenerating: true, error: undefined } } 
          : n
      )
    );
    
    // 重置并开始进度
    setProgress(0);
    
    try {
      const baseImages: string[] = [];
      let finalPrompt = resolvedPrompt;
      
      if (referencedNodes.length > 0) {
        let labelHeader = "The following images are provided for reference. Use the handles @name to refer to specific images in your generation task:\n";
        referencedNodes.forEach((node, idx) => {
          const name = node.data.label || `node_${node.id.slice(0,4)}`;
          labelHeader += `- Image Part ${idx + 1}: handle is @${name}\n`;
          baseImages.push((node.data.output || node.data.sourceImage) as string);
        });
        
        finalPrompt = labelHeader + "\nGeneration Task: " + resolvedPrompt;
      } else if (data.sourceImage) {
        baseImages.push(data.sourceImage);
      }

      console.log("开始生成图片...");
      const url = await generateImage(finalPrompt, { 
        model: data.config.model,
        aspectRatio: data.config.aspectRatio,
        quality: data.config.quality,
        baseImages: baseImages,
      });
      
      console.log("图片URL:", url);

      // 完成进度
      setProgress(100);

      // 创建缩略图用于显示，优化拖动性能
      const createThumbnail = (imgUrl: string): Promise<string> => {
        return new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 512;
            let thumbWidth = img.width;
            let thumbHeight = img.height;

            if (thumbWidth > thumbHeight) {
              if (thumbWidth > maxSize) {
                thumbHeight = (thumbHeight * maxSize) / thumbWidth;
                thumbWidth = maxSize;
              }
            } else {
              if (thumbHeight > maxSize) {
                thumbWidth = (thumbWidth * maxSize) / thumbHeight;
                thumbHeight = maxSize;
              }
            }

            canvas.width = thumbWidth;
            canvas.height = thumbHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            }
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = () => resolve(imgUrl);
          img.src = imgUrl;
        });
      };

      createThumbnail(url).then((thumbnailUrl: string) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === props.id
              ? { ...n, data: { ...n.data, output: thumbnailUrl, sourceImage: url, isGenerating: false, isUploaded: false, credits: Math.max(0, n.data.credits - cost) } }
              : n
          )
        );
        setTimeout(() => setProgress(0), 500);
      });
      
    } catch (error: any) {
      console.error("生成失败:", error);
      setProgress(0);
      setNodes((nds) => 
        nds.map((n) => 
          n.id === props.id 
            ? { ...n, data: { ...n.data, isGenerating: false, error: error.message || "生成失败" } } 
            : n
        )
      );
    }
  };

  // 模拟进度动画
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (data.isGenerating && progress < 90) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          const increment = Math.random() * 8;
          return Math.min(prev + increment, 90);
        });
      }, 300);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [data.isGenerating, progress]);

  const updateConfig = (update: Partial<NodeData['config']>) => {
     setNodes((nds) =>
       nds.map((n) =>
         n.id === props.id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...update } } } : n
       )
     );
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;

        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;

          // 创建缩略图用于显示
          const canvas = document.createElement('canvas');
          const maxSize = 512;
          let thumbWidth = img.width;
          let thumbHeight = img.height;

          if (thumbWidth > thumbHeight) {
            if (thumbWidth > maxSize) {
              thumbHeight = (thumbHeight * maxSize) / thumbWidth;
              thumbWidth = maxSize;
            }
          } else {
            if (thumbHeight > maxSize) {
              thumbWidth = (thumbWidth * maxSize) / thumbHeight;
              thumbHeight = maxSize;
            }
          }

          canvas.width = thumbWidth;
          canvas.height = thumbHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
          }
          const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.7);

          // 使用 Object URL 代替 base64 存储原始图片
          const objectUrl = URL.createObjectURL(file);

          setNodes((nds) =>
            nds.map((n) =>
              n.id === props.id ? {
                ...n,
                data: {
                  ...n.data,
                  output: thumbnailBase64,
                  sourceImage: objectUrl,
                  aspectRatio: ratio,
                  isUploaded: true,
                  fileSize: file.size
                }
              } : n
            )
          );
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const setQuality = (quality: '512p' | 'standard' | 'hd' | '4k') => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === props.id ? {
          ...n,
          data: { ...n.data, config: { ...n.data.config, quality } }
        } : n
      )
    );
  };

  const setAspectRatio = (ratioStr: string | null) => {
    let numericRatio: string | undefined;
    if (ratioStr) {
      const [w, h] = ratioStr.split(':').map(Number);
      numericRatio = `${w}/${h}`;
    }

    setNodes((nds) =>
      nds.map((n) =>
        n.id === props.id ? {
          ...n,
          data: {
            ...n.data,
            aspectRatio: numericRatio,
            config: { ...n.data.config, aspectRatio: ratioStr as any }
          }
        } : n
      )
    );
  };

  const isImage2Model = data.config.model?.includes("image2");

  const setImage2N = (n: number) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === props.id ? {
          ...n,
          data: { ...n.data, config: { ...n.data, n } }
        } : n
      )
    );
  };

  const setImage2Thinking = (thinking: 'off' | 'low' | 'medium' | 'high') => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === props.id ? {
          ...n,
          data: { ...n.data, config: { ...n.data, thinking } }
        } : n
      )
    );
  };

  const ratiosData = [
    { label: '1:1', value: '1:1', icon: 'w-[14px] h-[14px]', iconLarge: 'w-[20px] h-[20px]' },
    { label: '9:16', value: '9:16', icon: 'w-[10px] h-[18px]', iconLarge: 'w-[14px] h-[24px]' },
    { label: '16:9', value: '16:9', icon: 'w-[18px] h-[10px]', iconLarge: 'w-[24px] h-[14px]' },
    { label: '3:4', value: '3:4', icon: 'w-[12px] h-[16px]', iconLarge: 'w-[16px] h-[22px]' },
    { label: '4:3', value: '4:3', icon: 'w-[16px] h-[12px]', iconLarge: 'w-[22px] h-[16px]' },
    { label: '3:2', value: '3:2', icon: 'w-[18px] h-[12px]', iconLarge: 'w-[24px] h-[16px]' },
    { label: '2:3', value: '2:3', icon: 'w-[12px] h-[18px]', iconLarge: 'w-[16px] h-[24px]' },
    { label: '5:4', value: '5:4', icon: 'w-[16px] h-[13px]', iconLarge: 'w-[22px] h-[18px]' },
    { label: '4:5', value: '4:5', icon: 'w-[13px] h-[16px]', iconLarge: 'w-[18px] h-[22px]' },
    { label: '21:9', value: '21:9', icon: 'w-[20px] h-[9px]', iconLarge: 'w-[28px] h-[12px]' },
  ];

  const qualityValue = data.config.quality || 'standard';

  const getDynamicWidth = () => {
    if (!data.aspectRatio) return '180px';
    
    let ratio: number;
    if (typeof data.aspectRatio === 'number') {
      ratio = data.aspectRatio;
    } else if (typeof data.aspectRatio === 'string') {
      const parts = data.aspectRatio.includes('/') 
        ? data.aspectRatio.split('/') 
        : data.aspectRatio.split(':');
      
      if (parts.length === 2) {
        ratio = Number(parts[0]) / Number(parts[1]);
      } else {
        ratio = 1;
      }
    } else {
      return '180px';
    }
    
    if (ratio < 0.7) return '140px';
    if (ratio < 1) return '160px';
    if (ratio === 1) return '180px';
    if (ratio < 1.4) return '200px';
    if (ratio < 1.8) return '220px';
    if (ratio < 2.5) return '240px';
    return '260px';
  };

  const nodeWidth = getDynamicWidth();

  console.log("节点数据:", data); // 调试日志

  return (
    <BaseNode
      {...props}
      onGenerate={handleGenerate}
      topContent={!data.output && !data.sourceImage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 z-[999] pointer-events-auto group/upload-btn">
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerUpload();
            }}
            className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/50 hover:text-white px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all transform active:scale-95 whitespace-nowrap border border-white/10"
          >
            <Upload size={14} />
            <span>上传</span>
          </button>
        </div>
      )}
      renderConfig={() => (
        <div className="relative group/config">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all text-slate-400 hover:text-white group">
            <Zap size={16} className="text-slate-500" />
            <span className="text-sm font-bold uppercase tracking-tight">
              {data.config.aspectRatio || '自由'} · {
                qualityValue === '512p' ? '512P' :
                qualityValue === 'standard' ? '1K' :
                qualityValue === 'hd' ? '2K' : '4K'
              }
            </span>
          </button>

          <div className="absolute bottom-full right-0 mb-4 w-[340px] bg-[#1a1c24] border border-white/10 rounded-3xl shadow-2xl scale-0 group-hover/config:scale-100 transition-all origin-bottom-right z-[100] overflow-hidden backdrop-blur-xl text-left">
              <div className="p-5 space-y-5">
                <div className="space-y-3">
                  <div className="text-sm font-bold text-slate-500 pl-1">画质</div>
                  <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    {(['512p', 'standard', 'hd', '4k'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={cn(
                          "flex-1 py-2.5 text-sm font-bold uppercase transition-all rounded-xl",
                          qualityValue === q
                            ? "bg-white/10 text-white shadow-xl"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {q === '512p' ? '512P' : q === 'standard' ? '1K' : q === 'hd' ? '2K' : '4K'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-bold text-slate-500 pl-1">比例</div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
                    <button
                      onClick={() => setAspectRatio(null)}
                      className={cn(
                        "w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shrink-0",
                        !data.config.aspectRatio
                          ? "bg-white/10 text-white border border-white/10 shadow-xl"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
                    >
                      <Maximize2 size={20} />
                      <span className="text-xs font-bold">自适应</span>
                    </button>

                    <div className="w-px h-12 bg-white/5 shrink-0" />

                    <div className="grid grid-cols-5 gap-2 flex-grow">
                      {ratiosData.map((r) => (
                        <button
                          key={r.label}
                          onClick={() => setAspectRatio(r.value)}
                          className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                            data.config.aspectRatio === r.value
                              ? "bg-white/10 text-white border border-white/10 shadow-lg"
                              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "border-2 rounded transition-all",
                            r.iconLarge,
                            data.config.aspectRatio === r.value ? "border-white" : "border-current"
                          )} />
                          <span className="text-[9px] font-bold">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {isImage2Model && (
                  <>
                    <div className="space-y-3">
                      <div className="text-sm font-bold text-slate-500 pl-1">生成数量</div>
                      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        {([1, 2, 3, 4] as const).map((n) => (
                          <button
                            key={n}
                            onClick={() => setImage2N(n)}
                            className={cn(
                              "flex-1 py-2.5 text-sm font-bold uppercase transition-all rounded-xl",
                              (data.config.n || 1) === n
                                ? "bg-white/10 text-white shadow-xl"
                                : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            {n}张
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-bold text-slate-500 pl-1">思考级别</div>
                      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        {(['off', 'low', 'medium', 'high'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setImage2Thinking(t)}
                            className={cn(
                              "flex-1 py-2.5 text-sm font-bold uppercase transition-all rounded-xl",
                              (data.config.thinking || "off") === t
                                ? "bg-white/10 text-white shadow-xl"
                                : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            {t === 'off' ? '关' : t === 'low' ? '低' : t === 'medium' ? '中' : '高'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
        </div>
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "relative group/image overflow-hidden transition-all rounded-xl",
            isDragOver && "ring-2 ring-indigo-500 ring-inset bg-white/5"
          )}
          style={{
            width: nodeWidth,
            aspectRatio: data.aspectRatio ? data.aspectRatio : '1 / 1'
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {(data.output || data.sourceImage) && (
            <div className="absolute top-2 right-2 z-[40]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerUpload();
                }}
                className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-lg active:scale-90"
                title="替换图片"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}

          {data.output ? (
            <div className="w-full h-full flex items-center justify-center bg-[#090a0f] relative overflow-hidden">
              <img
                src={data.output}
                alt="AI Output"
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : data.sourceImage ? (
            <div
              className="w-full h-full flex items-center justify-center bg-[#090a0f] relative overflow-hidden"
            >
              <img
                src={data.sourceImage}
                alt="Source"
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 absolute inset-0">
              <div className="flex flex-col items-center justify-center p-4">
                {data.isGenerating ? (
                  <div className="flex flex-col items-center space-y-3">
                    <RefreshCw size={24} className="animate-spin text-indigo-500/70" />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">生成中...</span>
                  </div>
                ) : data.error ? (
                  <div className="text-center space-y-2">
                    <Zap size={24} className="text-red-500/50 mx-auto" />
                    <div className="text-[10px] text-red-500/70 font-medium max-w-[120px] line-clamp-3">
                      {data.error}
                    </div>
                  </div>
                ) : (
                  <ImageIcon size={32} className={cn("transition-colors", isDragOver ? "text-indigo-400" : "text-white/10")} />
                )}
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>
    </BaseNode>
  );
};
