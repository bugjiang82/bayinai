"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ImageOff } from "lucide-react";

export interface GalleryItem {
  id: string;
  url: string;
  prompt?: string;
  createdAt?: string;
}

export interface GalleryPanelProps {
  items: GalleryItem[];
  onDownload?: (item: GalleryItem) => void;
  onZoom?: (item: GalleryItem) => void;
  className?: string;
}

export default function GalleryPanel({
  items,
  onDownload,
  onZoom,
  className,
}: GalleryPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl border border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          生成画廊
        </h3>
        <span className="text-xs text-muted-foreground">
          {items.length} 张图片
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <ImageOff className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">暂无生成图片</p>
            <p className="text-xs text-muted-foreground mt-1">
              开始对话后，生成的图片将显示在这里
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img
                  src={item.url}
                  alt={item.prompt || "Generated"}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="flex w-full gap-1 p-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 flex-1 text-xs"
                      onClick={() => onDownload?.(item)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 flex-1 text-xs"
                      onClick={() => onZoom?.(item)}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
