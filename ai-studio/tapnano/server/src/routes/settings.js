import { Router } from 'express'
import {
  getSettings,
  updateSettings,
  addApiKey,
  removeApiKey,
  setActiveApiKey
} from '../db/index.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// 获取配置（任何登录用户可读）
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings()
    res.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

// 更新配置（需管理员）
router.put('/', requireAdmin, async (req, res) => {
  try {
    // 保留端点但不再使用代理相关字段
    res.json({ success: true, message: 'Settings endpoint active' })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// 添加 API KEY（需管理员）
router.post('/apikey', requireAdmin, async (req, res) => {
  try {
    const { apiKey } = req.body
    if (!apiKey || apiKey.length < 10) {
      return res.status(400).json({ error: 'Invalid API key' })
    }
    const updated = await addApiKey(apiKey)
    res.json({
      success: true,
      settings: updated
    })
  } catch (error) {
    console.error('Add API key error:', error)
    res.status(500).json({ error: 'Failed to add API key' })
  }
})

// 删除 API KEY（需管理员）
router.delete('/apikey/:index', requireAdmin, async (req, res) => {
  try {
    const { index } = req.params
    const updated = await removeApiKey(parseInt(index))
    res.json({
      success: true,
      settings: updated
    })
  } catch (error) {
    console.error('Remove API key error:', error)
    res.status(500).json({ error: 'Failed to remove API key' })
  }
})

// 设置活跃 API KEY（需管理员）
router.post('/apikey/active', requireAdmin, async (req, res) => {
  try {
    const { index } = req.body
    const updated = await setActiveApiKey(parseInt(index))
    res.json({
      success: true,
      settings: updated
    })
  } catch (error) {
    console.error('Set active API key error:', error)
    res.status(500).json({ error: 'Failed to set active API key' })
  }
})

export { router as settingsRouter }
