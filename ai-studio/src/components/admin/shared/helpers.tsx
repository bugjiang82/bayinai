import React from "react";
import { Image, Video, Pencil, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          已完成
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge className="text-[11px] bg-amber-500/10 text-amber-400 border-amber-500/20">
          处理中
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="text-[11px] bg-blue-500/10 text-blue-400 border-blue-500/20">
          等待中
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="text-[11px] bg-rose-500/10 text-rose-400 border-rose-500/20">
          失败
        </Badge>
      );
    default:
      return (
        <Badge className="text-[11px] bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
          {status}
        </Badge>
      );
  }
}

export function getTypeIcon(type: string) {
  switch (type) {
    case "VIDEO":
      return <Video className="w-4 h-4 text-purple-400" />;
    case "EDIT":
      return <Pencil className="w-4 h-4 text-pink-400" />;
    case "IMAGE_TO_IMAGE":
      return <Wand2 className="w-4 h-4 text-cyan-400" />;
    default:
      return <Image className="w-4 h-4 text-blue-400" />;
  }
}

export function getTypeLabel(type: string) {
  switch (type) {
    case "TEXT_TO_IMAGE":
      return "文生图";
    case "IMAGE_TO_IMAGE":
      return "图生图";
    case "VIDEO":
      return "视频";
    case "EDIT":
      return "编辑";
    default:
      return type;
  }
}