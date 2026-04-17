"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageUploaderProps {
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  maxSize?: number;
  className?: string;
  preview?: string | null;
  compact?: boolean;
  storageKey?: string;
}

export default function ImageUploader({
  onUpload,
  onRemove,
  maxSize = MAX_FILE_SIZE,
  className,
  preview: externalPreview,
  compact = false,
  storageKey = "image-upload",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(externalPreview || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 从本地存储加载数据
  useEffect(() => {
    if (storageKey && !externalPreview) {
      const storedPreview = localStorage.getItem(storageKey);
      if (storedPreview) {
        setPreview(storedPreview);
      }
    }
  }, [storageKey, externalPreview]);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const imageFile = item.getAsFile();
          if (imageFile) {
            handleFile(imageFile);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "不支持的文件格式，请上传 JPG、PNG 或 WebP 格式的图片";
    }
    if (f.size > maxSize) {
      return `文件大小超出限制（最大 ${Math.round(maxSize / 1024 / 1024)}MB）`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (f: File) => {
      setError(null);
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setPreview(previewUrl);
      };
      reader.readAsDataURL(f);

      // 实际上传文件
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const formData = new FormData();
        formData.append('file', f);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('上传失败');
        }
        
        const result = await response.json();
        if (result.success) {
          // 上传成功，保存到本地存储
          if (storageKey) {
            localStorage.setItem(storageKey, result.data.url);
          }
          // 更新预览为服务器返回的URL
          setPreview(result.data.url);
          onUpload?.(f);
        } else {
          throw new Error(result.error || '上传失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '上传失败');
      } finally {
        setIsUploading(false);
        setUploadProgress(100);
      }
    },
    [maxSize, onUpload, storageKey, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    setError(null);
    // 从本地存储移除
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    onRemove?.();
  };

  // Preview mode
  if (preview && !compact) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0f0f0f]", className)}>
        <div className="relative aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="预览"
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100"
            onClick={handleRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {isUploading && (
          <div className="p-3">
            <Progress value={Math.min(uploadProgress, 100)} className="h-1.5" />
            <p className="text-xs text-zinc-500 mt-1.5">
              上传中... {Math.min(Math.round(uploadProgress), 100)}%
            </p>
          </div>
        )}
        {file && (
          <div className="px-3 pb-3">
            <p className="text-xs text-zinc-500 truncate">{file.name}</p>
            <p className="text-xs text-zinc-600">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>
    );
  }

  // Upload area
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-indigo-500 bg-indigo-500/5"
          : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]",
        compact ? "p-4" : "p-8",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center gap-3 text-center">
        {compact ? (
          <>
            <Upload className="w-5 h-5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-400">点击或拖拽上传图片</p>
              <p className="text-xs text-zinc-600 mt-0.5">支持 JPG, PNG, WebP</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
              {preview ? (
                <ImageIcon className="w-6 h-6 text-indigo-400" />
              ) : (
                <Upload className="w-6 h-6 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">
                点击上传、拖拽或粘贴图片
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                支持 JPG、PNG、WebP 格式，最大 {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-3 text-center">{error}</p>
      )}

      {isUploading && preview && (
        <div className="mt-3">
          <Progress value={Math.min(uploadProgress, 100)} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
