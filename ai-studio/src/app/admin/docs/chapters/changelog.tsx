"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, FileCode, ArrowRight, History } from "lucide-react";

export const changelogChapter = {
  id: "changelog",
  title: "开发变更记录",
  sections: [
    {
      id: "changelog-overview",
      title: "2026-05-27 变更总览",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            以下记录了 2026-05-27 完成的所有开发任务，共 <span className="text-indigo-400 font-medium">8 项</span>，
            涉及 <span className="text-indigo-400 font-medium">9 个文件</span>，新增约 <span className="text-green-400 font-medium">140 行</span>，删除约 <span className="text-rose-400 font-medium">80 行</span>。
          </p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">变更影响范围汇总</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-left text-slate-400 font-medium">变更文件</th>
                    <th className="px-4 py-2 text-left text-slate-400 font-medium">行数变化</th>
                    <th className="px-4 py-2 text-left text-slate-400 font-medium">影响功能</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">BaseNode.tsx</td><td className="px-4 py-2">+30 / -25</td><td className="px-4 py-2">图片全屏拖拽、工具栏架构</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">generation.service.ts</td><td className="px-4 py-2">+15 / -15</td><td className="px-4 py-2">视频状态查询</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">video/route.ts</td><td className="px-4 py-2">1 行修改</td><td className="px-4 py-2">视频生成参数校验</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">generate/image/page.tsx</td><td className="px-4 py-2">-25 行</td><td className="px-4 py-2">历史记录数据加载</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">Canvas.tsx</td><td className="px-4 py-2">+20 / -10</td><td className="px-4 py-2">历史悬浮信息显示</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">ImageNode.tsx</td><td className="px-4 py-2">+25 / -5</td><td className="px-4 py-2">图片节点工具栏</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">VideoNode.tsx</td><td className="px-4 py-2">+60 / -10</td><td className="px-4 py-2">视频工具栏、播放器、比例</td></tr>
                  <tr className="border-b border-slate-800"><td className="px-4 py-2 font-mono text-xs">Sidebar.tsx</td><td className="px-4 py-2">1 行修改</td><td className="px-4 py-2">画布模式导航</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs">workspace/page.tsx</td><td className="px-4 py-2">+9 行</td><td className="px-4 py-2">工作空间返回按钮</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "changelog-1",
      title: "任务 #1 | 图片全屏预览拖拽修复",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">BaseNode.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              在画布模式中点击图片节点进入全屏预览后，放大图片并拖拽鼠标时，浏览器将鼠标移动解释为<span className="text-rose-300 font-medium">页面滚动行为</span>，而非改变图片的位移偏移量，导致无法正常平移图片。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">将 onMouseMove/onMouseUp 提升到 document 级别</span>：使用 <code className="px-1 bg-slate-800 rounded">document.addEventListener('mousemove', ..., &#123; passive: false &#125;)</code> 确保 e.preventDefault() 生效，即使鼠标移出 viewport 也能继续拖拽</li>
                <li><span className="font-medium">添加光标样式</span>：可拖拽时显示 grab，拖拽中显示 grabbing，不可拖拽时显示 default</li>
                <li><span className="font-medium">拖拽边界限制</span>：增加 maxX/maxY 防止图片被拖出可视范围过远</li>
              </ul>
            </CardContent>
          </Card>
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm">
            <p className="text-blue-400 font-medium">根因分析</p>
            <p className="text-slate-300 mt-1">原实现中 onMouseMove 仅绑定在 viewport div 上且缺少 preventDefault()，浏览器默认将拖拽解释为文本选择或页面滚动。</p>
          </div>
        </div>
      ),
    },
    {
      id: "changelog-2",
      title: "任务 #2 | 视频生成失败修复",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">generation.service.ts</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">video/route.ts</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              后台（DashScope）已成功提交视频生成任务，但前端显示"视频生成失败"。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-slate-300">1. getVideoStatus 错误检测逻辑重构</p>
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="text-rose-400">旧逻辑</span>：在所有 task_status 判断之前，用 output.code / result.code 和 output.message / result.message 判断是否有错误——任何非空值都会返回 FAILED
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="text-green-400">新逻辑</span>：移除激进的 code/message 预检查，严格按 task_status 进行状态映射，仅在 FAILED / CANCELED 时返回失败
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-300">2. cost 校验逻辑修正</p>
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="text-rose-400">旧逻辑</span>：<code className="px-1 bg-slate-800 rounded">if (!cost || cost &lt; 0)</code> — cost=0 被错误拒绝
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="text-green-400">新逻辑</span>：<code className="px-1 bg-slate-800 rounded">if (cost == null || cost &lt; 0)</code> — 仅检查 null/undefined 和负数
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm">
            <p className="text-blue-400 font-medium">根因分析</p>
            <p className="text-slate-300 mt-1">getVideoStatus 的错误检测过于激进，在 task_status 为 PENDING/RUNNING 时可能因 DashScope 响应的顶层 code 字段而返回 FAILED；!cost 校验在合法 cost=0 时拒绝请求。</p>
          </div>
        </div>
      ),
    },
    {
      id: "changelog-3",
      title: "任务 #3 | 历史记录悬浮卡片模型/质量/比例显示修复",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">generate/image/page.tsx</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Canvas.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              鼠标悬浮在历史记录图片上时，所有图片的模型信息都显示"Flash 大模型"，质量和比例信息也不正确。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">loadHistory / loadMoreHistory</span>：不再从 item.params 解析，直接从 item.model、item.imageSize、item.aspectRatio 读取（历史 API 已在服务端解析 params 为顶层属性）</li>
                <li><span className="font-medium">Canvas.tsx 模型名称映射</span>：使用映射表处理 flash / pro / image2 / gemini-3-pro-image-preview，未匹配模型名可兜底显示；增加质量值显示优化（"512"→"512P"）</li>
              </ul>
            </CardContent>
          </Card>
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm">
            <p className="text-blue-400 font-medium">根因分析</p>
            <p className="text-slate-300 mt-1">前端用错误的字段名（item.params）读取 API 响应数据，而 API 实际返回的是 item.model 等顶层字段，导致全部落入默认值分支。</p>
          </div>
        </div>
      ),
    },
    {
      id: "changelog-4",
      title: "任务 #4 | BaseNode 工具栏按节点类型拆分",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">BaseNode.tsx</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ImageNode.tsx</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VideoNode.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              图片节点和视频节点共用 BaseNode 中硬编码的统一菜单栏，但两类节点需要的功能按钮不同（图片需要 Upscale/全屏预览，视频不需要）。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">BaseNode.tsx</span>：新增 renderToolbar prop，接收回调函数 (actions) =&gt; ReactNode，暴露 onGenerate、onDownload、onFullscreen、onDelete、isGenerating、hasOutput</li>
                <li><span className="font-medium">ImageNode.tsx</span>：自定义工具栏 Redraw | Upscale Download Fullscreen | Delete</li>
                <li><span className="font-medium">VideoNode.tsx</span>：自定义工具栏 Redraw | Download Fullscreen | Delete</li>
              </ul>
            </CardContent>
          </Card>
          <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-sm">
            <p className="text-green-400 font-medium">架构收益</p>
            <p className="text-slate-300 mt-1">每个节点类型可独立定制工具栏按钮组合，后续新增按钮只需在对应节点的 renderToolbar 中添加，互不影响。</p>
          </div>
        </div>
      ),
    },
    {
      id: "changelog-5",
      title: "任务 #5 | 视频节点全屏预览 + 播放器",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VideoNode.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">需求描述</h4>
            <p className="text-sm text-slate-300">
              视频节点需要下载按钮和全屏预览按钮，全屏预览要有播放器，复用网站作品页面同样的 VideoPlayer 组件。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">导入 VideoPlayer</span>：从 @/components/generate/Canvas 导入，复用作品页面相同播放器</li>
                <li><span className="font-medium">createPortal 全屏实现</span>：渲染到 document.body，z-index: 99999，配置 autoPlay=true，点击背景关闭</li>
                <li><span className="font-medium">播放器功能</span>：播放/暂停、可拖拽进度条、静音切换、播放速度（0.5x-2x）、画中画、原生全屏、下载</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "changelog-6",
      title: "任务 #6 | 移除 hasOutput 条件渲染导致工具栏按钮消失",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ImageNode.tsx</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VideoNode.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              上一轮任务给 Download/Fullscreen 按钮添加了 hasOutput 条件渲染。当节点无输出时按钮消失，但两侧分隔线仍在，导致菜单栏显示异常。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">修复方案</h4>
              <p className="text-sm text-slate-300">
                移除 ImageNode.tsx 和 VideoNode.tsx 中的 hasOutput 条件包装，所有工具栏按钮始终显示，恢复与其他节点一致的菜单栏行为。
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "changelog-7",
      title: "任务 #7 | 视频节点配置增加画面比例选择",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VideoNode.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              视频节点的配置下拉只有分辨率和时长，缺少画面比例选择，与视频生成页面的功能不一致。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">导入 VIDEO_ASPECT_RATIO_OPTIONS</span>：来自 @/models，包含 5 个比例选项</li>
                <li><span className="font-medium">标签更新</span>：从"万相 2.2 · 720P · 5s"变为"万相 2.2 · 720P · 5s · 16:9"</li>
                <li><span className="font-medium">比例选择按钮组</span>：五项（16:9 横屏、9:16 竖屏、1:1 方形、4:3 标准、3:4 竖版），默认选中 16:9</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "changelog-8",
      title: "任务 #8 | 画布模式入口 + 返回按钮导航优化",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">2026-05-27</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Sidebar.tsx</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">workspace/page.tsx</Badge>
          </div>
          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">需求描述</h4>
            <p className="text-sm text-slate-300">
              点击画布模式后应跳转到工作空间页面（项目管理），而非直接进入画布编辑器；工作空间页面缺少返回按钮。
            </p>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">关键代码变更</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">Sidebar.tsx</span>：画布模式链接从 /workflow 改为 /workflow/workspace</li>
                <li><span className="font-medium">workspace/page.tsx</span>：标题上方新增"← 返回工作区"链接（href: /generate/image），使用 ArrowLeft 图标</li>
              </ul>
            </CardContent>
          </Card>
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm">
            <p className="text-blue-400 font-medium">修改原因</p>
            <p className="text-slate-300 mt-1">优化用户流程：先看到项目列表再选择进入，页面增加返回方式避免迷失导航。</p>
          </div>
        </div>
      ),
    },
  ],
} as const;