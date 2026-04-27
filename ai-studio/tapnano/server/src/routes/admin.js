/**
 * 管理员路由 — 用户管理（列表、创建、删除）
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '../middleware/auth.js'
import {
  listAllUsers,
  createUser,
  rejectUser,
  findUserByUsername
} from '../db/index.js'

const router = Router()

/**
 * GET /api/admin/users
 * 获取所有用户列表
 */
router.get('/users', requireAdmin, (req, res) => {
  try {
    const users = listAllUsers()
    res.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

/**
 * POST /api/admin/users
 * 管理员添加用户（直接 approved）
 */
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    if (username.length < 2 || username.length > 30) {
      return res.status(400).json({ error: '用户名长度需在 2-30 个字符之间' })
    }

    if (password.length < 4) {
      return res.status(400).json({ error: '密码至少需要 4 个字符' })
    }

    const existing = findUserByUsername(username)
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' })
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const user = createUser(username, passwordHash, role, 'approved')

    res.status(201).json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, status: user.status }
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: '创建用户失败' })
  }
})

/**
 * DELETE /api/admin/users/:id
 * 删除用户及其所有数据
 */
router.delete('/users/:id', requireAdmin, (req, res) => {
  try {
    // 不允许删除自己
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账号' })
    }

    rejectUser(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: '删除用户失败' })
  }
})

export { router as adminRouter }
