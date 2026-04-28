'use client';

import { useState, useCallback } from 'react';
import {
  Plus, X, Image, FileText, Video, Music, Box, Upload, ChevronDown,
  Heart, Share2, Users, Move, RotateCw, ZoomIn, MoreHorizontal,
  Shield, Folder, Download, Maximize2, Settings, Mic, Send, HelpCircle,
  Sparkles
} from 'lucide-react';

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { image: string | null; title: string; prompt: string };
}

export default function CanvasPage() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'node1',
      type: 'image',
      position: { x: 400, y: 150 },
      data: { 
        image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=colorful%20parrot%20bird%20on%20white%20background%20studio%20lighting&image_size=square', 
        title: '一只小太阳鹦鹉',
        prompt: '' 
      }
    }
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>('node1');
  const [showNodeMenu, setShowNodeMenu] = useState(true);
  const [model, setModel] = useState('flash');
  const [ratio, setRatio] = useState('1:1');
  const [quality, setQuality] = useState('2K');
  const [prompt, setPrompt] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [zoom, setZoom] = useState(100);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  }, [prompt]);

  const handleSend = useCallback(() => {
    if (prompt.trim()) {
      console.log('Sending:', { model, ratio, quality, prompt });
    }
  }, [model, ratio, quality, prompt]);

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node${Date.now()}`,
      type,
      position: { 
        x: 200 + Math.random() * 300, 
        y: 100 + Math.random() * 200 
      },
      data: { image: null, title: '', prompt: '' }
    };
    setNodes(prev => [...prev, newNode]);
    setShowNodeMenu(false);
  }, []);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  const nodeTypes = [
    { id: 'text', icon: FileText, label: '文本', desc: '脚本、广告词、品牌文案' },
    { id: 'image', icon: Image, label: '图片', desc: '' },
    { id: 'video', icon: Video, label: '视频', desc: '' },
    { id: 'audio', icon: Music, label: '音频', desc: '' },
    { id: '3d', icon: Box, label: '3D 世界', badge: 'Beta' },
  ];

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-medium">新手教学</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all">
            <Heart className="w-4 h-4" />
            <span>198</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all">
            <Users className="w-4 h-4" />
            <span>社区</span>
          </button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Top Toolbar */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10">
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Move className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Shield className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Folder className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-12 bottom-0 w-52 bg-[#0f0f0f]/80 backdrop-blur-xl border-r border-white/5 z-40 flex flex-col">
        {/* Toggle Button */}
        <button 
          onClick={() => setShowNodeMenu(!showNodeMenu)}
          className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
        >
          <span className="text-gray-300 text-sm font-medium">添加节点</span>
          <button className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </button>

        {/* Node Menu */}
        {showNodeMenu && (
          <div className="p-2 space-y-1">
            {nodeTypes.map((node) => (
              <button
                key={node.id}
                onClick={() => addNode(node.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <node.icon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">{node.label}</span>
                    {node.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">
                        {node.badge}
                      </span>
                    )}
                  </div>
                  {node.desc && (
                    <span className="text-gray-500 text-xs">{node.desc}</span>
                  )}
                </div>
              </button>
            ))}
            
            <div className="w-full h-px bg-white/5 my-2" />
            
            <div className="px-3 py-2">
              <span className="text-gray-500 text-xs">添加资源</span>
            </div>
            
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </div>
              <span className="text-gray-300 text-sm">上传</span>
            </button>
          </div>
        )}
      </aside>

      {/* Right Panel */}
      {showRightPanel && (
        <aside className="fixed right-0 top-12 bottom-0 w-80 bg-[#0f0f0f]/80 backdrop-blur-xl border-l border-white/5 z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <button className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setShowRightPanel(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Hi New Tapper!</p>
                <p className="text-gray-400 text-sm">今天一起创作点什么?</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <button className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-all">
                还可以更压一点
              </button>
              <button className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-all">
                先顺一顺
              </button>
              <button className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs transition-all">
                也许该松一点
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=colorful%20parrot%20bird%20small&image_size=square" 
                  alt="Preview" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="text-gray-300 text-sm">描述操作或用 @ 引用...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Settings className="w-4 h-4" />
              </button>
              <select className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20">
                <option>Pro</option>
                <option>Flash</option>
                <option>Image2</option>
              </select>
              <div className="w-px h-6 bg-white/10" />
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20">
                <option>Ask</option>
                <option>Create</option>
              </select>
              <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Mic className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Canvas */}
      <main className={`ml-52 ${showRightPanel ? 'mr-80' : ''} mt-20 w-[calc(100%-13rem)] h-[calc(100%-5rem)] relative`}>
        {/* Background Grid */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Canvas Content */}
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-full min-w-full flex items-start justify-center pt-8">
            {nodes.map((node) => (
              <div 
                key={node.id}
                className={`relative cursor-pointer transition-all ${
                  selectedNode === node.id ? 'ring-2 ring-indigo-500/50 ring-offset-4 ring-offset-[#0a0a0a]' : ''
                }`}
                style={{ position: 'absolute', left: node.position.x, top: node.position.y }}
                onClick={() => selectNode(node.id)}
              >
                {/* Image Node */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                  {/* Node Header */}
                  <div className="px-3 py-2 border-b border-white/5 flex items-center justify-center">
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Image
                    </span>
                  </div>
                  
                  {/* Image Content */}
                  <div className="relative aspect-square bg-[#0f0f0f] p-4">
                    {node.data.image ? (
                      <img 
                        src={node.data.image} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center">
                        <Plus className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-gray-500 text-xs">点击上传图片</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Left Handle */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center hover:bg-indigo-500 hover:border-indigo-400 transition-all cursor-pointer">
                    <Plus className="w-3 h-3 text-white/60" />
                  </div>
                </div>

                {/* Right Handle */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center hover:bg-indigo-500 hover:border-indigo-400 transition-all cursor-pointer">
                    <Plus className="w-3 h-3 text-white/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Property Panel */}
      {selectedNode && (
        <div className="fixed bottom-0 left-52 right-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-white/10 z-50">
          {showRightPanel && <div className="mr-80">}
            <div className="p-3">
              {/* Node Preview & Title */}
              <div className="flex items-center gap-3 mb-3">
                <button className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Folder className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
                <input 
                  type="text"
                  value={nodes.find(n => n.id === selectedNode)?.data.title || ''}
                  onChange={(e) => {
                    setNodes(prev => prev.map(n => 
                      n.id === selectedNode ? { ...n, data: { ...n.data, title: e.target.value } } : n
                    ));
                  }}
                  placeholder="输入标题..."
                  className="flex-1 bg-white/5 border border-transparent rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
                <button className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Model & Settings */}
              <div className="flex items-center gap-4">
                {/* Model Select */}
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    <option value="flash">TapNow Flash</option>
                    <option value="pro">TapNow Pro</option>
                    <option value="image2">TapNow Image2</option>
                  </select>
                </div>

                <div className="w-px h-4 bg-white/10" />

                {/* Aspect Ratio */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  <select 
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                  </select>
                  <span className="text-gray-500 text-sm">{quality}</span>
                </div>

                <div className="flex-1" />

                {/* Action Buttons */}
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Mic className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all">
                  <span className="text-xs font-medium mr-1">2</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all">
                  <Send className="w-4 h-4 inline mr-1" />
                  发送
                </button>
              </div>
            </div>
          {showRightPanel && </div>}
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <button className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </button>
          <button className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </button>
          <input 
            type="range"
            min="25"
            max="200"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-gray-500 text-xs w-12 text-right">{zoom}%</span>
        </div>
        <button className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}