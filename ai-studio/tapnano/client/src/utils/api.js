/**
 * 统一的 API 调用辅助
 * 自动附加 Bearer token
 */

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  // 如果 401，清除 token
  if (response.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  return response
}
