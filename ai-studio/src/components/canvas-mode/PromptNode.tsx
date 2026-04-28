'use client'

import { memo, useState, createPortal } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Copy, Check, Zap, X } from 'lucide-react'

interface PromptNodeProps {
  id: string
  data: {
    inheritImage?: string | null
    extractedPrompt?: string
    editedPrompt?: string
  }
}

const PromptNode = memo(({ id, data }: PromptNodeProps) => {
  const [image] = useState(data.inheritImage || null)
  const [userPrompt, setUserPrompt] = useState('')
  const [extractedPrompt, setExtractedPrompt] = useState(data.extractedPrompt || '')
  const [isExtracting, setIsExtracting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [status, setStatus] = useState('idle')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!extractedPrompt) return
    try {
      await navigator.clipboard.writeText(extractedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleSubmitPrompt = async () => {
    if (!image || isExtracting) return

    setIsExtracting(true)
    setStatus('extracting')

    try {
      const response = await fetch('/api/extract-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          userPrompt: userPrompt || '请分析这张图片并生成详细的提示词描述。'
        })
      })

      if (!response.ok) throw new Error('Extraction failed')

      const result = await response.json()
      setExtractedPrompt(result.prompt)
      data.extractedPrompt = result.prompt
      setStatus('extracted')
    } catch (error) {
      console.error('Extract error:', error)
      setStatus('error')
      alert('提取提示词失败，请稍后重试')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleClear = () => {
    setUserPrompt('')
    setExtractedPrompt('')
    setStatus('idle')
  }

  return (
    <div className="w-72 glass rounded-xl relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !-left-2.5 !z-50 !bg-cyber-cyan !border-[3px] !border-white !shadow-[0_0_15px_#00f5ff]"
      />

      <div className="px-4 py-2 bg-gradient-to-r from-cyber-cyan/10 to-transparent border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-cyber-cyan rounded-full shadow-[0_0_8px_#00f5ff]" />
        <span className="text-xs font-semibold tracking-wider uppercase text-cyber-cyan">
          提取提示词
        </span>
        {isExtracting && (
          <span className="ml-auto text-[10px] text-cyber-cyan animate-pulse">分析中...</span>
        )}
      </div>

      <div className="p-3">
        {image && (
          <div className="mb-3 flex items-center gap-3">
            <div
              className="w-16 h-16 bg-black/30 rounded-lg overflow-hidden border border-white/10 cursor-pointer flex-shrink-0"
              onClick={() => setShowPreview(true)}
            >
              <img
                src={image}
                alt="Reference"
                className="w-full h-full object-cover hover:scale-110 transition-transform"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                上级节点图片
              </span>
              <p className="text-[10px] text-white/30 mt-0.5">
                点击放大查看
              </p>
            </div>
          </div>
        )}

        {!image && (
          <div className="mb-3 p-3 bg-black/20 rounded-lg text-center">
            <span className="text-[10px] text-white/30">无参考图片</span>
          </div>
        )}

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-white/50 uppercase tracking-wider">
              {extractedPrompt ? '提取结果' : '输入分析指令'}
            </label>
            <div className="flex items-center gap-2">
              {extractedPrompt && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-cyber-cyan/70 hover:text-cyber-cyan transition-colors"
                  title="复制提示词"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制
                    </>
                  )}
                </button>
              )}
              {extractedPrompt && (
                <button
                  onClick={handleClear}
                  className="text-[10px] text-cyber-cyan/70 hover:text-cyber-cyan transition-colors"
                >
                  重新分析
                </button>
              )}
            </div>
          </div>

          <textarea
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg
              text-white text-sm outline-none resize-none
              focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.2)]
              placeholder:text-white/30 disabled:bg-black/50 disabled:text-white/70"
            rows={extractedPrompt ? 5 : 3}
            value={extractedPrompt || userPrompt}
            onChange={(e) => {
              if (!extractedPrompt) {
                setUserPrompt(e.target.value)
              }
            }}
            disabled={!!extractedPrompt}
            placeholder={image
              ? "输入提示词指导AI如何分析图片，例如：描述这张图片的艺术风格、主要元素和光影效果..."
              : "请先连接上级节点获取图片"
            }
          />
        </div>

        {!extractedPrompt && image && (
          <button
            onClick={handleSubmitPrompt}
            disabled={isExtracting}
            className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-cyber-cyan/20 to-cyber-cyan/5
              border border-cyber-cyan/30 text-cyber-cyan text-sm font-medium
              hover:from-cyber-cyan/40 hover:to-cyber-cyan/10 hover:shadow-[0_0_15px_rgba(0,245,255,0.3)]
              disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isExtracting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
                正在分析图片...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                提交分析
              </span>
            )}
          </button>
        )}

        {status === 'extracted' && (
          <div className="mt-2 p-2 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg">
            <span className="text-[10px] text-cyber-cyan flex items-center gap-1">
              <Check className="w-3 h-3" />
              提示词已提取成功
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <span className="text-[10px] text-red-400">提取失败，请重试</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !-right-2.5 !z-50 !bg-cyber-magenta !border-[3px] !border-white !shadow-[0_0_15px_#ff00ff]"
      />

      {showPreview && image && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <img
              src={image}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,245,255,0.3)]"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-cyber-cyan transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

PromptNode.displayName = 'PromptNode'

export default PromptNode
