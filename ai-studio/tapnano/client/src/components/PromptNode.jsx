import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { createPortal } from 'react-dom'
import { apiFetch } from '../utils/api'

const PromptNode = memo(({ id, data }) => {
  const [image, setImage] = useState(data.inheritImage || null)
  const [userPrompt, setUserPrompt] = useState('')
  const [extractedPrompt, setExtractedPrompt] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [status, setStatus] = useState('idle')
  const [copied, setCopied] = useState(false)

  // 复制提示词
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

  // 提交用户提示词并调用多模态大模型
  const handleSubmitPrompt = async () => {
    if (!image || isExtracting) return

    setIsExtracting(true)
    setStatus('extracting')

    try {
      const response = await apiFetch('/api/generate/extract-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          userPrompt: userPrompt || '请分析这张图片并生成详细的提示词描述。' // 如果没有输入，使用默认提示
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

  // 清空重新输入
  const handleClear = () => {
    setUserPrompt('')
    setExtractedPrompt('')
    setStatus('idle')
  }

  return (
    <div className="w-72 glass rounded-xl relative">
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !-left-2.5 !z-50 !bg-cyber-cyan !border-[3px] !border-white !shadow-[0_0_15px_#00f5ff]"
      />

      {/* 节点头部 */}
      <div className="px-4 py-2 bg-gradient-to-r from-cyber-cyan/10 to-transparent border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-cyber-cyan rounded-full shadow-[0_0_8px_#00f5ff]" />
        <span className="text-xs font-semibold tracking-wider uppercase text-cyber-cyan">
          提取提示词
        </span>
        {isExtracting && (
          <span className="ml-auto text-[10px] text-cyber-cyan animate-pulse">分析中...</span>
        )}
      </div>

      {/* 节点主体 */}
      <div className="p-3">
        {/* 参考图片区域 - 小缩略图 */}
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

        {/* 提示词输入/显示区域 */}
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
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      已复制
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
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

        {/* 提交按钮 - 只在未提取时显示 */}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                提交分析
              </span>
            )}
          </button>
        )}

        {/* 状态提示 */}
        {status === 'extracted' && (
          <div className="mt-2 p-2 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg">
            <span className="text-[10px] text-cyber-cyan flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !-right-2.5 !z-50 !bg-cyber-magenta !border-[3px] !border-white !shadow-[0_0_15px_#ff00ff]"
      />

      {/* 图片预览弹窗 */}
      {showPreview && createPortal(
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
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
