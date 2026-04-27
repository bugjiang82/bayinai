/**
 * SQLite 数据库层
 * 替代内存 Map，实现数据持久化
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = join(__dirname, '../../data.sqlite')
const db = new Database(DB_PATH)

// 启用 WAL 模式和外键
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ==================== 初始化（模块加载时立即执行） ====================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Untitled',
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// 种子 admin 用户
const adminExistsAtInit = db.prepare('SELECT id FROM users WHERE username = ?').get('bugjiang')
if (!adminExistsAtInit) {
  const passwordHash = bcrypt.hashSync('buzhidao', 10)
  db.prepare('INSERT INTO users (id, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'bugjiang', passwordHash, 'admin', 'approved')
  console.log('🔐 Admin user created: bugjiang')
}

// 种子默认设置
const settingsExistsAtInit = db.prepare("SELECT key FROM settings WHERE key = 'system'").get()
if (!settingsExistsAtInit) {
  const defaultSettings = {
    apiKeys: process.env.GOOGLE_API_KEY ? [process.env.GOOGLE_API_KEY] : [],
    activeApiKeyIndex: 0
  }
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
    .run('system', JSON.stringify(defaultSettings))
}

console.log('✅ SQLite initialized at', DB_PATH)

export function initDatabase() {
  return true
}

// ==================== Canvas 管理 ====================

export const saveCanvas = (id, name, nodes, edges, userId) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO canvases (id, user_id, name, nodes, edges, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          nodes = excluded.nodes,
          edges = excluded.edges,
          updated_at = datetime('now')
        WHERE user_id = ?
      `)
      const result = stmt.run(id || uuidv4(), userId, name || 'Untitled', JSON.stringify(nodes), JSON.stringify(edges), userId)
      resolve({ id: result.lastInsertRowid ? id : id, name: name || 'Untitled' })
    } catch (err) {
      reject(err)
    }
  })
}

export const loadCanvas = (id) => {
  return new Promise((resolve) => {
    const canvas = db.prepare('SELECT * FROM canvases WHERE id = ?').get(id)
    if (canvas) {
      resolve({
        ...canvas,
        nodes: JSON.parse(canvas.nodes),
        edges: JSON.parse(canvas.edges)
      })
    } else {
      resolve(null)
    }
  })
}

export const listCanvases = (userId) => {
  return new Promise((resolve, reject) => {
    try {
      if (userId) {
        const list = db.prepare('SELECT id, name, created_at, updated_at FROM canvases WHERE user_id = ? ORDER BY updated_at DESC').all(userId)
        resolve(list)
      } else {
        resolve([])
      }
    } catch (err) {
      reject(err)
    }
  })
}

export const deleteCanvas = (id) => {
  return new Promise((resolve) => {
    db.prepare('DELETE FROM canvases WHERE id = ?').run(id)
    resolve({ deleted: true })
  })
}

// ==================== 设置管理 ====================

export const getSettings = () => {
  return new Promise((resolve) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'system'").get()
    const s = row ? JSON.parse(row.value) : { apiKeys: [], activeApiKeyIndex: 0, proxyMode: true, proxyUrl: '' }
    const maskedKeys = s.apiKeys.map(key => ({
      masked: key.substring(0, 8) + '****' + key.substring(key.length - 4),
      full: key
    }))
    resolve({
      ...s,
      apiKeys: maskedKeys,
      activeApiKey: s.apiKeys[s.activeApiKeyIndex] || null
    })
  })
}

export const getRawSettings = () => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'system'").get()
  return row ? JSON.parse(row.value) : { apiKeys: [], activeApiKeyIndex: 0, proxyMode: true, proxyUrl: '' }
}

export const updateSettings = (newSettings) => {
  return new Promise((resolve) => {
    const current = getRawSettings()
    const updated = { ...current, ...newSettings }
    db.prepare("UPDATE settings SET value = ? WHERE key = 'system'").run(JSON.stringify(updated))
    resolve(updated)
  })
}

export const addApiKey = (apiKey) => {
  return new Promise((resolve) => {
    const current = getRawSettings()
    if (!current.apiKeys.includes(apiKey)) {
      current.apiKeys.push(apiKey)
      if (current.apiKeys.length === 1) {
        current.activeApiKeyIndex = 0
      }
    }
    db.prepare("UPDATE settings SET value = ? WHERE key = 'system'").run(JSON.stringify(current))
    resolve(current)
  })
}

export const removeApiKey = (index) => {
  return new Promise((resolve) => {
    const current = getRawSettings()
    current.apiKeys.splice(index, 1)
    if (current.activeApiKeyIndex >= current.apiKeys.length) {
      current.activeApiKeyIndex = Math.max(0, current.apiKeys.length - 1)
    }
    db.prepare("UPDATE settings SET value = ? WHERE key = 'system'").run(JSON.stringify(current))
    resolve(current)
  })
}

export const setActiveApiKey = (index) => {
  return new Promise((resolve) => {
    const current = getRawSettings()
    if (index >= 0 && index < current.apiKeys.length) {
      current.activeApiKeyIndex = index
    }
    db.prepare("UPDATE settings SET value = ? WHERE key = 'system'").run(JSON.stringify(current))
    resolve(current)
  })
}

// ==================== 用户管理 ====================

export const createUser = (username, passwordHash, role = 'user', status = 'pending') => {
  const id = uuidv4()
  db.prepare('INSERT INTO users (id, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?)')
    .run(id, username, passwordHash, role, status)
  return { id, username, role, status }
}

export const findUserByUsername = (username) => {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null
}

export const findUserById = (id) => {
  return db.prepare('SELECT id, username, role, status, created_at FROM users WHERE id = ?').get(id) || null
}

export const getPendingUsers = () => {
  return db.prepare("SELECT id, username, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC").all()
}

export const approveUser = (userId) => {
  db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(userId)
  return findUserById(userId)
}

export const rejectUser = (userId) => {
  // 同时删除该用户的所有画布
  db.prepare('DELETE FROM canvases WHERE user_id = ?').run(userId)
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  return { deleted: true }
}

export const listAllUsers = () => {
  return db.prepare('SELECT id, username, role, status, created_at FROM users ORDER BY created_at DESC').all()
}

// 导出 db 实例（供某些场景直接使用）
export { db }
