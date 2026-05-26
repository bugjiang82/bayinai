"use client";

import React, { useState, useEffect } from "react";
import {
  IMAGE_MODELS,
  IMAGE_QUALITY_OPTIONS,
  VIDEO_MODELS,
  VIDEO_RESOLUTION_OPTIONS,
  getImageCost,
  getVideoCostPerSecond,
  createPolicyKey,
  type ImageModelId,
  type ImageQuality,
  type VideoModelId,
  type VideoResolution,
} from "@/models";
import { useCreditPolicies, prefetchCreditPolicies } from "@/hooks/useCreditPolicies";

prefetchCreditPolicies();

const VIDEO_MODEL_DISPLAY_NAMES: Record<string, string> = {
  "wan2.2-kf2v-flash": "万相 2.2",
  "wan2.7-r2v": "万相 2.7 (图生)",
  "wan2.7-t2v": "万相 2.7 (文生)",
  "happyhorse-1.0-t2v": "HappyHorse (文生)",
  "happyhorse-1.0-i2v": "HappyHorse (图生)",
  "veo-3.1-lite-generate-preview": "Veo 3.1",
};

export default function CreditPoliciesTestPage() {
  const { policies, loaded, getImageCostFromApi, getVideoCostFromApi } = useCreditPolicies();

  const imageModelIds = Object.keys(IMAGE_MODELS) as ImageModelId[];
  const qualities: ImageQuality[] = ["512", "1K", "2K", "4K"];
  const videoModelIds = Object.keys(VIDEO_MODELS) as VideoModelId[];
  const resolutions: VideoResolution[] = ["480P", "720P", "1080P"];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">积分策略验证页面</h1>
        <p className="text-zinc-500 mb-8">
          验证前端是否正确读取了数据库/API 中的最新积分策略
        </p>

        <div className="mb-6 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${loaded ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-sm font-medium">
              {loaded ? `已从 API 加载 ${Object.keys(policies).length} 条策略` : "正在加载策略..."}
            </span>
          </div>
          {loaded && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(policies).slice(0, 6).map(([key, val]) => (
                <code key={key} className="text-xs bg-white/[0.04] px-2 py-1 rounded text-zinc-400">
                  {key}: {val.cost}{val.unit}
                </code>
              ))}
              {Object.keys(policies).length > 6 && (
                <code className="text-xs bg-white/[0.04] px-2 py-1 rounded text-zinc-500">
                  ...还有 {Object.keys(policies).length - 6} 条
                </code>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ============ 图片积分矩阵 ============ */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
              <h2 className="text-lg font-semibold">图片生成积分矩阵</h2>
              <p className="text-xs text-zinc-500 mt-1">展示 模型 × 质量 组合的积分消耗</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-zinc-500">模型</th>
                    {qualities.map(q => (
                      <th key={q} className="text-center px-4 py-3 text-zinc-500">{q}</th>
                    ))}
                    <th className="text-center px-4 py-3 text-zinc-400">默认(硬编码)</th>
                  </tr>
                </thead>
                <tbody>
                  {imageModelIds.map(modelId => {
                    const model = IMAGE_MODELS[modelId];
                    return (
                      <tr key={modelId} className="border-b border-white/[0.04]">
                        <td className="px-4 py-3 font-medium">{model.name}</td>
                        {qualities.map(q => {
                          const isSupported = model.supportedQualities.includes(q);
                          const apiCost = isSupported ? getImageCostFromApi(modelId, q) : null;
                          const defaultCost = isSupported ? getImageCost(modelId, q) : null;
                          const match = apiCost === defaultCost;

                          return (
                            <td key={q} className="text-center px-4 py-3">
                              {isSupported ? (
                                <div className="space-y-0.5">
                                  <div className={match ? "text-emerald-400" : "text-amber-400"}>
                                    {apiCost}
                                  </div>
                                  <div className="text-[10px] text-zinc-600">
                                    {match ? "=默认" : `默认=${defaultCost}`}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-700">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center px-4 py-3">
                          {model.supportedQualities.map(q => getImageCost(modelId, q)).join("/")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-white/[0.02] border-t border-white/[0.06]">
              <p className="text-xs text-zinc-600">
                <span className="text-emerald-400">绿色</span> = API 值与默认值一致&nbsp;&nbsp;
                <span className="text-amber-400">黄色</span> = API 值已变更（管理员已修改）
              </p>
            </div>
          </div>

          {/* ============ 视频积分矩阵 ============ */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
              <h2 className="text-lg font-semibold">视频生成积分矩阵</h2>
              <p className="text-xs text-zinc-500 mt-1">展示 模型 × 分辨率 的每秒积分消耗</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-zinc-500">模型</th>
                    {resolutions.map(r => (
                      <th key={r} className="text-center px-4 py-3 text-zinc-500">{r}</th>
                    ))}
                    <th className="text-center px-4 py-3 text-zinc-400">5s 总价</th>
                  </tr>
                </thead>
                <tbody>
                  {videoModelIds.map(modelId => {
                    const model = VIDEO_MODELS[modelId];
                    const displayName = VIDEO_MODEL_DISPLAY_NAMES[modelId] || model.name;
                    return (
                      <tr key={modelId} className="border-b border-white/[0.04]">
                        <td className="px-4 py-3 font-medium text-sm">{displayName}</td>
                        {resolutions.map(r => {
                          const isSupported = model.supportedResolutions.includes(r);
                          const apiCost = isSupported ? getVideoCostFromApi(modelId, r) : null;
                          const defaultCost = isSupported ? getVideoCostPerSecond(modelId, r) : null;
                          const match = apiCost === defaultCost;

                          return (
                            <td key={r} className="text-center px-4 py-3">
                              {isSupported ? (
                                <div className="space-y-0.5">
                                  <div className={match ? "text-emerald-400" : "text-amber-400 text-sm"}>
                                    {apiCost}/秒
                                  </div>
                                  <div className="text-[10px] text-zinc-600">
                                    {match ? "=默认" : `默认=${defaultCost}`}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-700">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center px-4 py-3">
                          {model.supportedResolutions.length > 0 ? (
                            <span className="text-zinc-400">
                              {getVideoCostFromApi(modelId, model.supportedResolutions[0], 5)}分
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-white/[0.02] border-t border-white/[0.06]">
              <p className="text-xs text-zinc-600">
                视频按秒计费，5秒视频总价 = 每秒消耗 × 5
              </p>
            </div>
          </div>
        </div>

        {/* ============ 模型选择器模拟 ============ */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-lg font-semibold">ModelSelector 组件模拟</h2>
            <p className="text-xs text-zinc-500 mt-1">模拟不同质量下 ModelSelector 显示的值</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {imageModelIds.map(modelId => {
                const model = IMAGE_MODELS[modelId];
                return (
                  <div key={modelId} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <h3 className="font-medium text-sm mb-3">{model.name}</h3>
                    <div className="space-y-2">
                      {qualities.map(q => {
                        if (!model.supportedQualities.includes(q)) return null;
                        const cost = getImageCostFromApi(modelId, q);
                        return (
                          <div key={q} className="flex justify-between text-xs">
                            <span className="text-zinc-500">{q}</span>
                            <span className="text-emerald-400 font-medium">{cost} 积分</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============ API 原始数据 ============ */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-lg font-semibold">API 原始数据</h2>
            <p className="text-xs text-zinc-500 mt-1">
              GET /api/credits/policies 返回的全部策略
            </p>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(policies, null, 2)}
            </pre>
          </div>
        </div>

        {/* ============ 使用说明 ============ */}
        <div className="mt-8 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-sm font-semibold mb-3">验证步骤</h2>
          <ol className="text-xs text-zinc-500 space-y-1.5 list-decimal list-inside">
            <li>运行种子脚本: <code className="text-emerald-400 bg-white/[0.04] px-1.5 py-0.5 rounded">npm run db:seed-credits</code></li>
            <li>启动开发服务器: <code className="text-emerald-400 bg-white/[0.04] px-1.5 py-0.5 rounded">npm run dev</code></li>
            <li>打开本页面: <code className="text-emerald-400 bg-white/[0.04] px-1.5 py-0.5 rounded">http://localhost:5050/test/credit-policies</code></li>
            <li>访问 <code className="text-emerald-400 bg-white/[0.04] px-1.5 py-0.5 rounded">/generate/image</code> 查看 ModelSelector 显示的积分值是否与矩阵一致</li>
            <li>访问 <code className="text-emerald-400 bg-white/[0.04] px-1.5 py-0.5 rounded">/generate/video</code> 查看视频页面显示的积分值是否与矩阵一致</li>
            <li>访问 <code className="text-emerald-400 bg-white/[0.04] px-1.5 py-0.5 rounded">/admin/credit-policies</code> 修改某条规则后刷新本页面，观察颜色变化</li>
          </ol>
        </div>
      </div>
    </div>
  );
}