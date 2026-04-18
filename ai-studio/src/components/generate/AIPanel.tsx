import React, { useState } from 'react';
import { useEditStore } from '@/store/editStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';

export const AIPanel: React.FC = () => {
  const { currentImage, selectionPath, shapes } = useEditStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const hasSelection = selectionPath && selectionPath.length >= 4;
  const hasShapes = shapes.length > 0;

  const handleGenerate = async () => {
    if (!currentImage || !prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // 这里可以调用 API 进行图片生成
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      // 模拟结果
      setResult(currentImage);
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-editor-bg border-t border-white/5 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">AI 编辑</h2>
          <div className="text-xs text-white/40">
            {hasSelection ? '已选择区域' : hasShapes ? '已绘制内容' : '未选择区域'}
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要在选中区域生成的内容..."
            className="min-h-[80px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600"
          />

          <Button
            className="w-full h-11 text-sm font-semibold rounded-xl transition-all duration-300"
            onClick={handleGenerate}
            disabled={!currentImage || !prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成内容
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="mt-6 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-lg">
            <h3 className="text-sm font-medium text-emerald-400 mb-2">生成结果</h3>
            <div className="rounded-lg overflow-hidden border border-white/[0.08]">
              <img 
                src={result} 
                alt="生成结果" 
                className="w-full h-40 object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
