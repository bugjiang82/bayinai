/**
 * 登录 / 注册页面（赛博朋克风格）
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        const result = await register(username, password)
        setSuccess('注册成功，请等待管理员审核')
        setUsername('')
        setPassword('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setSuccess('')
    setUsername('')
    setPassword('')
  }

  return (
    <div className="w-full h-screen flex items-center justify-center relative" style={{ background: 'var(--dark-bg)' }}>
      <div className="cyber-grid" />

      <div className="glass px-8 py-8 rounded-2xl w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="neon-text text-2xl font-bold mb-1">Cyber-Node</h1>
          <p className="text-white/40 text-sm">视觉节点图像实验室</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex mb-6 border-b border-white/10">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 pb-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
              mode === 'login'
                ? 'text-cyber-cyan border-cyber-cyan'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            登 录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 pb-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
              mode === 'register'
                ? 'text-cyber-magenta border-cyber-magenta'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            注 册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all"
                placeholder="请输入用户名"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 transition-all"
                placeholder="请输入密码"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          {/* 错误 & 成功提示 */}
          {error && (
            <div className="mt-4 px-4 py-2.5 rounded-lg bg-cyber-magenta/10 border border-cyber-magenta/30 text-cyber-magenta text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 px-4 py-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm">
              {success}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting}
            className={`
              w-full mt-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
              ${mode === 'login'
                ? 'bg-cyber-cyan/20 border-2 border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 hover:border-cyber-cyan hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-50'
                : 'bg-cyber-magenta/20 border-2 border-cyber-magenta/50 text-cyber-magenta hover:bg-cyber-magenta/30 hover:border-cyber-magenta hover:shadow-[0_0_20px_rgba(255,0,255,0.3)] disabled:opacity-50'
              }
            `}
          >
            {submitting ? '处理中...' : mode === 'login' ? '登 录' : '提交注册申请'}
          </button>
        </form>

        {/* 切换提示 */}
        {mode === 'register' ? (
          <p className="mt-4 text-center text-xs text-white/40">
            已有账号？<button onClick={switchMode} className="text-cyber-cyan hover:underline">去登录</button>
          </p>
        ) : (
          <p className="mt-4 text-center text-xs text-white/40">
            没有账号？<button onClick={switchMode} className="text-cyber-magenta hover:underline">申请注册</button>
          </p>
        )}
      </div>
    </div>
  )
}
