"use client";

import { useEffect } from "react";
import { Home, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center px-4">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-rose-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-3">
          出了点问题
        </h1>

        {/* Error message */}
        <p className="text-zinc-400 text-base max-w-md mx-auto mb-2 leading-relaxed">
          应用程序发生了意外错误。请尝试刷新页面或返回首页。
        </p>

        {error.message && (
          <p className="text-sm text-zinc-500 max-w-lg mx-auto mb-8 font-mono bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2">
            {error.message}
          </p>
        )}

        {!error.message && <div className="mb-8" />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => reset()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重试
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white"
            asChild
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
