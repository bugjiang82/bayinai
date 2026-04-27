import { useState, useEffect } from 'react'

export function AdminPanel({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    apiKeys: [],
    activeApiKeyIndex: 0
  })
  const [newApiKey, setNewApiKey] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings({
            apiKeys: data.settings.apiKeys || [],
            activeApiKeyIndex: data.settings.activeApiKeyIndex
          })
        }
      }
    } catch (error) {
      console.error('Load settings error:', error)
    }
  }

  const addApiKey = async () => {
    if (!newApiKey.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/settings/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newApiKey.trim() })
      })
      if (res.ok) {
        setNewApiKey('')
        await loadSettings()
        setSaveStatus('API Key 已添加')
        setTimeout(() => setSaveStatus(''), 2000)
      }
    } catch (error) {
      setSaveStatus('添加失败')
    }
    setLoading(false)
  }

  const removeApiKey = async (index) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/settings/apikey/${index}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await loadSettings()
        setSaveStatus('API Key 已删除')
        setTimeout(() => setSaveStatus(''), 2000)
      }
    } catch (error) {
      setSaveStatus('删除失败')
    }
    setLoading(false)
  }

  const setActiveApiKey = async (index) => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/apikey/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      })
      if (res.ok) {
        await loadSettings()
        setSaveStatus('已切换 API Key')
        setTimeout(() => setSaveStatus(''), 2000)
      }
    } catch (error) {
      setSaveStatus('切换失败')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass p-6 rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-cyber-cyan">后台管理</h2>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* API KEY 管理 */}
        <div className="mb-6 p-4 bg-black/20 rounded-xl">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyber-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API Key 管理
          </h3>

          {/* 添加新 Key */}
          <div className="flex gap-2 mb-4">
            <input
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="输入新的 Google API Key"
              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg
                text-white text-sm outline-none
                focus:border-cyber-magenta focus:shadow-[0_0_10px_rgba(255,0,255,0.2)]
                placeholder:text-white/30"
            />
            <button
              onClick={addApiKey}
              disabled={!newApiKey.trim() || loading}
              className="px-4 py-2 rounded-lg bg-cyber-magenta/20 border border-cyber-magenta/30
                text-cyber-magenta text-sm font-medium
                hover:bg-cyber-magenta/30 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              添加
            </button>
          </div>

          {/* API Key 列表 */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {settings.apiKeys.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">
                暂无 API Key，将使用环境变量中的 KEY
              </p>
            ) : (
              settings.apiKeys.map((key, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    index === settings.activeApiKeyIndex
                      ? 'bg-cyber-cyan/10 border-cyber-cyan/30'
                      : 'bg-black/20 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="activeKey"
                      checked={index === settings.activeApiKeyIndex}
                      onChange={() => setActiveApiKey(index)}
                      className="w-4 h-4 accent-cyber-cyan"
                    />
                    <span className="text-sm font-mono text-white/80">
                      {key.masked}
                    </span>
                    {index === settings.activeApiKeyIndex && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan">
                        使用中
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeApiKey(index)}
                    disabled={loading}
                    className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 关闭按钮 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
