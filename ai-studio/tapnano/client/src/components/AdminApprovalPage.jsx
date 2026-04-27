/**
 * 管理员审批页面
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

export default function AdminApprovalPage({ onBack }) {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setPendingUsers(data.users || [])
      }
    } catch (err) {
      console.error('Fetch pending error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = async (userId, username) => {
    setStatus(`正在通过 ${username} 的申请...`)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })
      if (res.ok) {
        setStatus(`${username} 的审核已通过`)
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
      } else {
        const data = await res.json()
        setStatus(`操作失败：${data.error}`)
      }
    } catch (err) {
      setStatus('操作失败')
    }
    setTimeout(() => setStatus(''), 3000)
  }

  const handleReject = async (userId, username) => {
    setStatus(`正在拒绝 ${username} 的申请...`)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })
      if (res.ok) {
        setStatus(`${username} 的申请已拒绝`)
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
      } else {
        const data = await res.json()
        setStatus(`操作失败：${data.error}`)
      }
    } catch (err) {
      setStatus('操作失败')
    }
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <div className="w-full h-screen relative" style={{ background: 'var(--dark-bg)' }}>
      <div className="cyber-grid" />

      <div className="relative z-10 p-6 max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="glass px-6 py-4 rounded-xl mb-6 flex items-center justify-between">
          <div>
            <h2 className="neon-text text-lg font-bold">用户审批</h2>
            <p className="text-xs text-white/40 mt-0.5">审核用户的注册申请</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-sm bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all"
          >
            返回画布
          </button>
        </div>

        {/* 状态提示 */}
        {status && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm">
            {status}
          </div>
        )}

        {/* 待审核列表 */}
        <div className="glass rounded-xl p-6">
          {loading ? (
            <p className="text-white/40 text-sm text-center py-4">加载中...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">暂无待审核用户</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{u.username}</p>
                    <p className="text-white/30 text-xs">
                      注册时间：{new Date(u.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(u.id, u.username)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleReject(u.id, u.username)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyber-magenta/20 border border-cyber-magenta/40 text-cyber-magenta hover:bg-cyber-magenta/30 transition-all"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
