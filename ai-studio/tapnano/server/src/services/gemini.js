/**
 * Gemini Image Generation Service
 * 使用 Google Gemini 3 Flash API 进行图像生成
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getRawSettings } from '../db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env') })

const ENV_API_KEY = process.env.GOOGLE_API_KEY
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent'

function getApiKey() {
  const settings = getRawSettings()
  const activeKey = settings.apiKeys[settings.activeApiKeyIndex]
  return activeKey || ENV_API_KEY
}

console.log('🎨 Gemini Service - API Key:', getApiKey() ? '已设置' : '未设置')

/**
 * 生成图像
 * @param {string} prompt - 提示词
 * @param {string} baseImage - 基础图像 (base64)
 * @param {object} settings - 设置
 * @returns {Promise<{imageUrl: string}>}
 */
export async function generateImage(prompt, baseImage, settings = {}) {
  const GOOGLE_API_KEY = getApiKey()

  if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY not set, using mock generation')
    return mockGenerate(prompt, baseImage, settings)
  }

  try {
    const { strength = 0.75 } = settings

    const parts = []

    if (baseImage) {
      const base64Data = baseImage.replace(/^data:image\/\w+;base64,/, '')
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      })
    }

    const enhancedPrompt = baseImage
      ? `Based on the reference image above, ${prompt}. Maintain similar style and composition.`
      : prompt

    parts.push({ text: enhancedPrompt })

    const requestBody = {
      contents: [{
        role: 'user',
        parts: parts
      }],
      generationConfig: {
        temperature: 0.9 - (strength * 0.4),
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseModalities: ['Text', 'Image']
      }
    }

    const response = await fetch(`${API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Gemini API error')
    }

    const data = await response.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)

    if (imagePart?.inlineData?.data) {
      return {
        imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
        prompt
      }
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text)
    if (textPart) {
      console.log('Gemini text response:', textPart.text.substring(0, 200))
    }

    throw new Error('No image generated')

  } catch (error) {
    console.error('Gemini generation error:', error.message || error)
    return mockGenerate(prompt, baseImage, settings)
  }
}

/**
 * Mock 图像生成（用于测试或 API 不可用时）
 * 使用 SVG 生成模拟图像
 */
async function mockGenerate(prompt, baseImage, settings = {}) {
  const { strength = 0.75, resolution = '1k', aspectRatio = '1:1' } = settings

  // 模拟延迟
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))

  // 根据提示词生成颜色
  const hue1 = stringToHash(prompt) % 360
  const hue2 = (hue1 + 60) % 360

  // 基础尺寸
  const baseSize = resolution === '4k' ? 1024 : resolution === '2k' ? 768 : 512

  // 根据比例计算宽高
  const [wRatio, hRatio] = aspectRatio.split(':').map(Number)
  let width, height
  if (wRatio >= hRatio) {
    width = baseSize
    height = Math.round(baseSize * hRatio / wRatio)
  } else {
    height = baseSize
    width = Math.round(baseSize * wRatio / hRatio)
  }

  // 生成随机几何图形
  const shapes = []
  const shapeCount = Math.floor(5 + strength * 15)

  for (let i = 0; i < shapeCount; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const r = Math.random() * (Math.min(width, height) / 3) * (0.5 + strength * 0.5)
    const strokeColor = `hsla(${(hue1 + i * 20) % 360}, 80%, 60%, ${0.3 + Math.random() * 0.4})`
    const fillColor = `hsla(${(hue2 + i * 15) % 360}, 70%, 30%, ${0.1 + Math.random() * 0.2})`

    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`)
  }

  // 文本换行
  const lines = wrapText(prompt, 20)
  const lineHeight = Math.min(width, height) / 15
  const textY = height / 2 - ((lines.length - 1) * lineHeight) / 2

  const svgTexts = lines.map((line, i) =>
    `<text x="${width / 2}" y="${textY + i * lineHeight}" fill="rgba(255,255,255,0.9)" font-size="${Math.min(width, height) / 20}" font-weight="bold" text-anchor="middle" font-family="sans-serif">${escapeXml(line)}</text>`
  ).join('')

  // 背景渐变
  const bgGradient = `linear-gradient(135deg, hsl(${hue1}, ${30 + strength * 40}%, 15%) 0%, hsl(${hue2}, ${40 + strength * 30}%, 8%) 100%)`

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue1}, ${30 + strength * 40}%, 15%)"/>
      <stop offset="100%" style="stop-color:hsl(${hue2}, ${40 + strength * 30}%, 8%)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g opacity="0.3">
    ${shapes.join('')}
  </g>
  <g filter="url(#glow)">
    ${svgTexts}
  </g>
  <text x="${width / 2}" y="${height - 30}" fill="rgba(0,245,255,0.6)" font-size="14" font-family="monospace" text-anchor="middle">
    STRENGTH: ${Math.round(strength * 100)}% | ${resolution.toUpperCase()} | ${aspectRatio}
  </text>
</svg>`

  // 转换为 base64
  const base64 = Buffer.from(svg).toString('base64')

  return {
    imageUrl: `data:image/svg+xml;base64,${base64}`,
    prompt
  }
}

// 文字换行
function wrapText(text, maxChars) {
  const words = text.split(/\s+/)
  const lines = []
  let currentLine = words[0] || ''

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
      if (lines.length >= 2) break // 最多3行
    }
  }
  lines.push(currentLine)
  return lines
}

// XML 转义
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[c])
}

// 字符串转哈希
function stringToHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * 从图像中提取提示词（图像理解）
 * @param {string} image - 图像 (base64)
 * @param {string} userPrompt - 用户提供的分析提示词（可选）
 * @returns {Promise<{prompt: string}>}
 */
export async function extractPromptFromImage(image, userPrompt = '') {
  const GOOGLE_API_KEY = getApiKey()

  if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY not set, using mock extraction')
    return { prompt: mockExtractPrompt(image) }
  }

  try {
    const VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent'
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')

    const analysisPrompt = userPrompt.trim()
      ? `${userPrompt.trim()}\n\nPlease analyze this image and respond with a detailed text prompt.`
      : 'Please analyze this image and provide a detailed text prompt that could be used to generate a similar image. Describe the style, colors, composition, subject, lighting, and any other important details. Respond with only the prompt text, nothing else.'

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          {
            text: analysisPrompt
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    }

    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Vision API error')
    }

    const data = await response.json()
    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text)

    if (textPart?.text) {
      return {
        prompt: textPart.text.trim()
      }
    }

    throw new Error('No text extracted')

  } catch (error) {
    console.error('Extract prompt error:', error.message || error)
    return { prompt: mockExtractPrompt(image) }
  }
}

/**
 * Mock 提示词提取（用于测试或 API 不可用时）
 */
function mockExtractPrompt(image) {
  const mockPrompts = [
    'A cyberpunk cat with glowing neon fur, sitting on a futuristic rooftop overlooking a neon-lit cityscape at night, vibrant pink and cyan lights reflecting off its metallic accessories, high detail digital art',
    'A majestic lion with golden mane, photorealistic portrait, dramatic lighting, dark background, professional photography style, 8k resolution',
    'A serene Japanese garden with cherry blossoms in full bloom, traditional wooden bridge over a koi pond, soft morning light filtering through trees, watercolor painting style',
    'An astronaut floating in space, Earth visible in the background, vibrant galaxy colors, cinematic composition, sci-fi digital art, lens flare effects',
    'A cozy cabin in a snowy forest at twilight, warm light glowing from windows, smoke rising from chimney, northern lights in the sky, photorealistic landscape'
  ]

  return mockPrompts[Math.floor(Math.random() * mockPrompts.length)]
}
