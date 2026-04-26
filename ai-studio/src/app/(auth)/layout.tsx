import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a0a0a]">
        {/* Background gradient decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[128px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Brand Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              八音-六维AI工作平台
            </span>
          </Link>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            释放你的
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              创造力
            </span>
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            利用人工智能技术，轻松生成令人惊叹的图像、视频和创意内容。加入我们，开启你的AI创作之旅。
          </p>

          {/* Feature highlights */}
          <div className="mt-10 space-y-4">
            {[
              "高质量AI图像与视频生成",
              "丰富的专业模板库",
              "智能体辅助创作流程",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-sm text-zinc-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        {/* Mobile brand - shown only on small screens */}
        <div className="absolute top-8 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI创意工作室
            </span>
          </Link>
        </div>

        {/* Subtle background decoration for mobile */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute top-1/3 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md mt-12 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
