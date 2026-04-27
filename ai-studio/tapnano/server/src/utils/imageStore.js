/**
 * 图片持久化工具
 * 将画布中的 base64 图片写入磁盘，并按用户名/画布/节点分类
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_DIR = path.join(__dirname, '../uploads')

/**
 * MIME 到文件扩展名的映射
 */
const mimeToExt = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp'
}

/**
 * 将画布节点中的 base64 图片写入磁盘
 * 返回替换为文件路径的新节点数组
 *
 * @param {Array} nodes - ReactFlow 节点数组
 * @param {string} canvasId - 画布 ID
 * @param {string} username - 用户名
 * @returns {Array} 替换了图片路径的节点数组
 */
export async function saveImagesToDisk(nodes, canvasId, username) {
  if (!nodes || !Array.isArray(nodes)) return nodes

  const safeUsername = sanitize(username)
  const safeCanvasId = sanitize(canvasId)
  const userDir = path.join(UPLOADS_DIR, safeUsername)
  const canvasDir = path.join(userDir, safeCanvasId)

  // 确保目录存在
  fs.mkdirSync(canvasDir, { recursive: true })

  const relativeBaseUrl = `/uploads/${safeUsername}/${safeCanvasId}`

  const modifiedNodes = []
  for (const node of nodes) {
    if (!node.data) { modifiedNodes.push(node); continue }

    const newData = { ...node.data }

    // 处理 ImageNode 的 data.image
    if (newData.image && typeof newData.image === 'string') {
      const result = await extractAndSaveBase64Image(newData.image, canvasDir, node.id)
      if (result) {
        newData.image = `${relativeBaseUrl}/${result}`
      }
    }

    // 处理继承图片
    if (newData.inheritImage && typeof newData.inheritImage === 'string') {
      const result = await extractAndSaveBase64Image(newData.inheritImage, canvasDir, node.id + '_inherit')
      if (result) {
        newData.inheritImage = `${relativeBaseUrl}/${result}`
      }
    }

    modifiedNodes.push({ ...node, data: newData })
  }

  return modifiedNodes
}

/**
 * 删除某个画布的所有图片文件
 *
 * @param {string} username - 用户名
 * @param {string} canvasId - 画布 ID
 */
export function deleteCanvasImages(username, canvasId) {
  const canvasDir = path.join(UPLOADS_DIR, sanitize(username), sanitize(canvasId))

  try {
    if (fs.existsSync(canvasDir)) {
      fs.rmSync(canvasDir, { recursive: true, force: true })
    }

    // 清理空的用户目录
    const userDir = path.join(UPLOADS_DIR, sanitize(username))
    if (fs.existsSync(userDir) && fs.readdirSync(userDir).length === 0) {
      fs.rmdirSync(userDir)
    }
  } catch (error) {
    console.error('Error deleting canvas images:', error.message)
  }
}

/**
 * 从 data URI 中提取 base64 图片并写入磁盘
 * 返回纯文件名（如果输入不是有效的 data URI 则返回 null）
 */
async function extractAndSaveBase64Image(dataUri, canvasDir, nodeId) {
  // 只处理 base64 data URI
  const match = dataUri.match(/^data:(image\/[^;]+);base64,(.+)$/)
  if (!match) return null

  const mimeType = match[1]
  const base64Data = match[2]
  const ext = mimeToExt[mimeType] || '.png'

  const fileName = `${sanitize(nodeId)}${ext}`
  const filePath = path.join(canvasDir, fileName)

  try {
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))

    // 生成缩略图：最长边 256px，JPEG 质量 75
    const thumbName = `${sanitize(nodeId)}_thumb.jpg`
    const thumbPath = path.join(canvasDir, thumbName)
    await sharp(Buffer.from(base64Data, 'base64'))
      .resize(256, 256, { fit: 'inside' })
      .jpeg({ quality: 75 })
      .toFile(thumbPath)

    return fileName
  } catch (error) {
    console.error(`Error saving image for node ${nodeId}:`, error.message)
    return null
  }
}

/**
 * 清理文件名中的非法字符
 */
function sanitize(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, '_')
}

/**
 * 确保 uploads 目录存在
 */
export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}
