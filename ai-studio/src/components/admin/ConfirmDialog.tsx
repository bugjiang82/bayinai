"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        style={{ animation: "fadeIn 0.15s ease-out" }}
      />
      <div
        className="relative bg-[#141414] border border-white/[0.08] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        style={{ animation: "scaleIn 0.15s ease-out" }}
      >
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-300"
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            确认删除
          </Button>
        </div>
      </div>
    </div>
  );
}