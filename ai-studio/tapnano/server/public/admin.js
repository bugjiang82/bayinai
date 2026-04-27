let token = localStorage.getItem('admin_token')
let currentUser = null

// ========== Auth ==========

async function checkAuth() {
  if (!token) { showLogin(); return }
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      currentUser = data.user
      showDashboard()
    } else {
      token = null; localStorage.removeItem('admin_token'); showLogin()
    }
  } catch { showLogin() }
}

function showLogin() {
  document.getElementById('loginPage').classList.add('active')
  document.getElementById('dashboardPage').classList.remove('active')
}

function showDashboard() {
  document.getElementById('loginPage').classList.remove('active')
  document.getElementById('dashboardPage').classList.add('active')
  document.getElementById('topUsername').textContent = currentUser.username
  loadPending()
}

function logout() {
  token = null; currentUser = null
  localStorage.removeItem('admin_token')
  showLogin()
  document.getElementById('loginUsername').value = ''
  document.getElementById('loginPassword').value = ''
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.getElementById('loginUsername').value
  const password = document.getElementById('loginPassword').value
  const errEl = document.getElementById('loginError')
  errEl.style.display = 'none'
  const btn = document.getElementById('loginBtn')
  btn.disabled = true; btn.textContent = '处理中...'

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    if (data.user.role !== 'admin') throw new Error('仅管理员可以访问管理后台')
    token = data.token; currentUser = data.user
    localStorage.setItem('admin_token', token)
    showDashboard()
  } catch (err) {
    errEl.textContent = err.message; errEl.style.display = 'block'
  } finally {
    btn.disabled = false; btn.textContent = '登 录'
  }
})

// ========== API Helper ==========

function api(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }
  if (body) opts.body = JSON.stringify(body)
  return fetch(url, opts).then(r => r.json().then(d => ({ status: r.status, data: d })))
}

function toast(msg, type = 'success') {
  const el = document.createElement('div')
  el.className = `toast toast-${type}`; el.textContent = msg; document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

function timeAgo(d) {
  const t = new Date(d + 'Z')
  const diff = (Date.now() - t.getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return t.toLocaleDateString('zh-CN')
}

function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML }

// ========== Tabs ==========

function switchTab(tab) {
  const tabIds = ['tab-pending', 'tab-users', 'tab-settings']
  tabIds.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  })
  const el = document.getElementById('tab-' + tab)
  if (el) el.style.display = 'block'
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.toggle('active', t.dataset.tab === tab))

  if (tab === 'pending') loadPending()
  if (tab === 'users') loadUsers()
  if (tab === 'settings') { loadSettings(); loadApiKeys() }
}

// ========== Data Loading ==========

async function loadPending() {
  const el = document.getElementById('pendingList')
  if (!el) return
  try {
    const { status, data } = await api('GET', '/api/auth/pending')
    if (status.ok && data.users && data.users.length > 0) {
      el.innerHTML = `<table><thead><tr><th>用户名</th><th>注册时间</th><th>操作</th></tr></thead><tbody>${
        data.users.map(u => `<tr>
          <td><span style="font-weight:500;">${esc(u.username)}</span></td>
          <td style="color:rgba(255,255,255,0.4);font-size:12px;">${timeAgo(u.created_at)}</td>
          <td><div class="action-row">
            <button onclick="approveUser('${u.id}')" class="btn btn-cyan btn-sm">通过</button>
            <button onclick="rejectUser('${u.id}')" class="btn btn-red btn-sm">拒绝</button>
          </div></td>
        </tr>`).join('')}</tbody></table>`
    } else {
      el.innerHTML = '<div class="empty-state">暂无待审核用户</div>'
    }
  } catch {
    el.innerHTML = '<div class="empty-state">加载失败</div>'
  }
}

async function loadUsers() {
  const el = document.getElementById('userList')
  if (!el) return
  try {
    const { status, data } = await api('GET', '/api/admin/users')
    if (status.ok && data.users && data.users.length > 0) {
      el.innerHTML = `<table><thead><tr><th>用户名</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead><tbody>${
        data.users.map(u => `<tr>
          <td style="font-weight:500;">${esc(u.username)}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : ''}">${u.role === 'admin' ? '管理员' : '用户'}</span></td>
          <td><span class="badge ${u.status === 'approved' ? 'badge-approved' : 'badge-pending'}">${u.status === 'approved' ? '已通过' : '待审批'}</span></td>
          <td style="color:rgba(255,255,255,0.4);font-size:12px;">${timeAgo(u.created_at)}</td>
          <td><div class="action-row">
            ${u.role !== 'admin' ? `<button onclick="deleteUser('${u.id}')" class="btn btn-red btn-sm">删除</button>` : '<span style="color:rgba(255,255,255,0.2);font-size:12px;">保护</span>'}
          </div></td>
        </tr>`).join('')}</tbody></table>`
    } else {
      el.innerHTML = '<div class="empty-state">暂无用户</div>'
    }
  } catch {
    el.innerHTML = '<div class="empty-state">加载失败</div>'
  }
}

async function loadSettings() {
  // Network settings removed
}

async function loadApiKeys() {
  const el = document.getElementById('apiKeyList')
  if (!el) return
  try {
    const { status, data } = await api('GET', '/api/settings')
    if (!data.settings || !data.settings.apiKeys || data.settings.apiKeys.length === 0) {
      el.innerHTML = '<div class="empty-state">暂无 API Key</div>'; return
    }
    const activeIdx = data.settings.activeApiKeyIndex ?? -1
    el.innerHTML = data.settings.apiKeys.map((k, i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:8px;margin-bottom:8px;${i === activeIdx ? 'background:rgba(0,245,255,0.1);border:1px solid rgba(0,245,255,0.3)' : 'background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05)'}">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-family:monospace;font-size:13px;">${esc(k.masked)}</span>
        ${i === activeIdx ? '<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(0,245,255,0.2);color:var(--neon-cyan);">使用中</span>' : ''}
      </div>
      <button onclick="removeApiKey(${i})" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;padding:4px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>`).join('')
  } catch {}
}

// ========== Actions ==========

async function approveUser(userId) {
  try {
    const { status } = await api('POST', '/api/auth/approve', { userId })
    if (status.ok) { toast('已通过'); loadPending(); loadUsers() }
  } catch {}
}

async function rejectUser(userId) {
  try {
    const { status } = await api('POST', '/api/auth/reject', { userId })
    if (status.ok) { toast('已拒绝'); loadPending(); loadUsers() }
  } catch {}
}

async function addUser() {
  const username = document.getElementById('addUsername').value.trim()
  const password = document.getElementById('addPassword').value
  const role = document.getElementById('addRole').value
  if (!username || !password) { toast('请填写用户名和密码', 'error'); return }
  try {
    const { status, data } = await api('POST', '/api/admin/users', { username, password, role })
    if (status === 201 || status === 200) {
      toast('添加成功')
      document.getElementById('addUsername').value = ''
      document.getElementById('addPassword').value = ''
      loadUsers()
    } else {
      toast(data.error || '添加失败', 'error')
    }
  } catch {
    toast('添加失败', 'error')
  }
}

async function deleteUser(userId) {
  showConfirm('确定要删除该用户及其所有数据吗？此操作不可恢复。', async () => {
    try {
      const { status } = await api('DELETE', `/api/admin/users/${userId}`)
      if (status.ok) { toast('已删除'); loadUsers() }
    } catch {}
  })
}

async function saveSettings() {
  toast('设置已保存')
}

async function addApiKey() {
  const key = document.getElementById('newApiKey').value.trim()
  if (!key) return
  try {
    const { status } = await api('POST', '/api/settings/apikey', { apiKey: key })
    if (status === 200 || status === 201) { document.getElementById('newApiKey').value = ''; toast('API Key 已添加'); loadApiKeys() }
    else toast('添加失败', 'error')
  } catch {}
}

async function removeApiKey(index) {
  try {
    const { status } = await api('DELETE', `/api/settings/apikey/${index}`)
    if (status.ok) { toast('已删除'); loadApiKeys() }
  } catch {}
}

// ========== Confirm Modal ==========

let confirmCallback = null
function showConfirm(msg, callback) {
  document.getElementById('confirmMsg').textContent = msg
  document.getElementById('confirmModal').classList.add('active')
  confirmCallback = callback
}
function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('active')
  confirmCallback = null
}
document.getElementById('confirmBtn').addEventListener('click', () => {
  if (confirmCallback) confirmCallback()
  closeConfirm()
})

// ========== Init ==========
checkAuth()
