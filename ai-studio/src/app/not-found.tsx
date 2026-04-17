import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center px-4">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* 404 Number */}
        <h1 className="relative text-[120px] sm:text-[160px] md:text-[200px] font-bold leading-none tracking-tighter mb-4">
          <span className="bg-gradient-to-b from-white/20 via-white/10 to-transparent bg-clip-text text-transparent">
            404
          </span>
        </h1>

        {/* Description */}
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
          页面未找到
        </h2>
        <p className="text-zinc-400 text-base max-w-md mx-auto mb-8 leading-relaxed">
          抱歉，你访问的页面不存在或已被移除。请检查 URL 是否正确，或返回首页。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
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
