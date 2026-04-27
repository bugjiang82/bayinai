let currentUser = null;

async function checkAuth() {
    try {
        const response = await fetch('/api/auth_status');
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = '/login';
            return null;
        }

        currentUser = data.user;
        return currentUser;
    } catch (error) {
        window.location.href = '/login';
        return null;
    }
}

const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt');
const smartOptimizeBtn = document.getElementById('smart-optimize-btn');
const aspectRatioSelect = document.getElementById('aspect_ratio');
const imageSizeSelect = document.getElementById('image_size');
const modelSelect = document.getElementById('model');
const thinkingToggle = document.getElementById('thinking-toggle');
const thinkingLabel = document.getElementById('thinking-label');
const statusText = document.getElementById('status');
const historyGrid = document.getElementById('history-grid');
const previewSection = document.getElementById('preview-section');
const previewImage = document.getElementById('preview-image');

const DEFAULT_MODEL = 'gemini-3-flash-image-preview';

let isGenerating = false;
let countdownInterval = null;
const BASE_ESTIMATED_TIME = 60;

function loadSettings() {
    const savedPrompt = localStorage.getItem('nano_prompt');
    const savedAspect = localStorage.getItem('nano_aspect_ratio');
    const savedSize = localStorage.getItem('nano_image_size');
    const savedThinking = localStorage.getItem('nano_thinking');
    const savedModel = localStorage.getItem('nano_model');

    if (savedPrompt !== null) promptInput.value = savedPrompt;
    if (savedAspect !== null) aspectRatioSelect.value = savedAspect;
    if (savedSize !== null) imageSizeSelect.value = savedSize;
    if (savedModel !== null && modelSelect) modelSelect.value = savedModel;

    if (savedThinking === 'true') {
        thinkingToggle.checked = true;
        thinkingLabel.textContent = 'High';
    }
}

function saveSettings() {
    localStorage.setItem('nano_prompt', promptInput.value);
    localStorage.setItem('nano_aspect_ratio', aspectRatioSelect.value);
    localStorage.setItem('nano_image_size', imageSizeSelect.value);
    if (modelSelect) localStorage.setItem('nano_model', modelSelect.value);
    localStorage.setItem('nano_thinking', thinkingToggle.checked);
}

loadSettings();

thinkingToggle.addEventListener('change', () => {
    thinkingLabel.textContent = thinkingToggle.checked ? 'High' : 'Minimal';
    saveSettings();
});

aspectRatioSelect.addEventListener('change', saveSettings);
imageSizeSelect.addEventListener('change', saveSettings);
if (modelSelect) modelSelect.addEventListener('change', saveSettings);
promptInput.addEventListener('change', saveSettings);

function startCountdown(duration, startTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        if (remaining === 0) {
            statusText.textContent = '正在生成...（预计时间已过，请耐心等待）';
        } else {
            statusText.textContent = `正在生成... 预计还需 ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function getImageUrl(filename) {
    if (!currentUser || !filename) return '';
    return `/data/${currentUser.id}/images/${filename}`;
}

function getThumbnailUrl(filename) {
    if (!currentUser || !filename) return '';
    return `/data/${currentUser.id}/images/${filename}`;
}

async function loadHistory() {
    try {
        const response = await fetch('/history');
        const history = await response.json();
        renderHistory(history);
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

function renderHistory(history) {
    historyGrid.innerHTML = '';

    if (history.length === 0) {
        historyGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1; padding: 40px 0;">暂无生成记录<br><span style="font-size: 0.85rem;">生成的图片将显示在这里</span></p>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';

        const img = document.createElement('img');
        img.src = getThumbnailUrl(item.filename);
        img.alt = item.prompt;
        img.loading = 'lazy';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
        deleteBtn.title = '删除';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            confirmDelete(item.id, item.filename, div);
        };

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);

        const info = document.createElement('div');
        info.className = 'info';

        const metaDiv = document.createElement('div');
        metaDiv.className = 'meta';
        metaDiv.style.cssText = 'font-size: 0.7rem; color: #999; margin-bottom: 6px; display: flex; justify-content: space-between;';

        const modelLabel = item.model && item.model.includes('pro') ? 'Banana Pro' : 'Banana2';
        const timeStr = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}) : '';
        const settingsStr = `${item.aspect_ratio || '1:1'} | ${item.image_size || '1K'}`;
        metaDiv.innerHTML = `<span>${modelLabel} | ${settingsStr}</span><span>${timeStr}</span>`;

        const promptInputEl = document.createElement('input');
        promptInputEl.type = 'text';
        promptInputEl.className = 'prompt-input';
        promptInputEl.value = item.prompt;
        promptInputEl.placeholder = '修改提示词...';

        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'regenerate-btn';
        regenerateBtn.textContent = '重新生成';
        regenerateBtn.onclick = (e) => {
            e.stopPropagation();
            regenerateImage(item.id, promptInputEl.value, item.aspect_ratio, item.image_size, item.thinking_level, item.model);
        };

        info.appendChild(metaDiv);
        info.appendChild(promptInputEl);
        info.appendChild(regenerateBtn);
        div.appendChild(imgContainer);
        div.appendChild(info);

        img.addEventListener('click', () => {
            promptInput.value = item.prompt || '';
            promptInput.focus();
            showPreview(getImageUrl(item.filename), item.prompt);
        });

        historyGrid.appendChild(div);
    });
}

async function confirmDelete(imageId, filename, element) {
    const confirmed = await showDeleteConfirmDialog();
    if (confirmed) {
        await deleteImage(imageId, filename, element);
    }
}

function showDeleteConfirmDialog() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'delete-dialog-overlay';
        overlay.innerHTML = `
            <div class="delete-dialog">
                <div class="delete-dialog-header">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#e74c3c"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    <span>确认删除</span>
                </div>
                <div class="delete-dialog-body">
                    <p>确定要删除这张图片吗？</p>
                    <p class="delete-dialog-hint">此操作可以在 5 秒内撤销</p>
                </div>
                <div class="delete-dialog-footer">
                    <button class="btn-cancel" onclick="this.closest('.delete-dialog-overlay').remove(); window.deleteResolve(false);">取消</button>
                    <button class="btn-delete" onclick="this.closest('.delete-dialog-overlay').remove(); window.deleteResolve(true);">删除</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        window.deleteResolve = resolve;

        setTimeout(() => {
            if (document.body.contains(overlay)) {
                overlay.remove();
                resolve(false);
            }
        }, 10000);
    });
}

async function deleteImage(imageId, filename, element) {
    const deleteBtn = element.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="loading-spinner"></span>';
    }

    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';

    try {
        const response = await fetch(`/api/image/${imageId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            element.style.transition = 'all 0.3s ease';
            element.style.transform = 'scale(0.8)';
            element.style.opacity = '0';

            setTimeout(() => {
                element.remove();
                const remainingItems = historyGrid.querySelectorAll('.history-item');
                if (remainingItems.length === 0) {
                    renderHistory([]);
                }
            }, 300);

            showStatus('已删除 (5秒内可刷新页面撤销)', 'success');
        } else {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
            }
            showStatus(result.error || '删除失败', 'error');
        }
    } catch (error) {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
        }
        showStatus('删除失败: ' + error.message, 'error');
    }
}

function showPreview(src, prompt) {
    previewImage.src = src;
    previewImage.alt = prompt;
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

function showStatus(message, type) {
    statusText.textContent = message;
    statusText.className = `status ${type} show`;

    if (type !== 'loading') {
        setTimeout(() => {
            statusText.classList.remove('show');
        }, 5000);
    }
}

async function smartOptimizePrompt() {
    if (smartOptimizeBtn.disabled) return;

    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatus('请输入描述', 'error');
        return;
    }

    smartOptimizeBtn.disabled = true;
    smartOptimizeBtn.querySelector('span').innerHTML = '<span class="loading-spinner"></span> 优化中...';
    showStatus('正在优化提示词...', 'loading');

    try {
        console.log('Sending optimization request for:', prompt);

        const response = await fetch('/api/optimize-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok || !data.success) {
            throw new Error(data.error || '优化失败');
        }

        promptInput.value = data.optimized_prompt;
        showStatus('优化成功！', 'success');

    } catch (error) {
        console.error('Optimization error:', error);
        showStatus(error.message, 'error');
    } finally {
        smartOptimizeBtn.disabled = false;
        smartOptimizeBtn.querySelector('span').innerHTML = '✨ 智能优化';
    }
}

async function generateImage() {
    if (isGenerating) return;

    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatus('请输入描述', 'error');
        return;
    }

    isGenerating = true;
    generateBtn.disabled = true;
    const startTime = Date.now();
    const estimatedTime = thinkingToggle.checked ? BASE_ESTIMATED_TIME * 2 : BASE_ESTIMATED_TIME;
    showStatus(`正在生成... 预计还需 ${Math.floor(estimatedTime/60)}:00`, 'loading');
    startCountdown(estimatedTime, startTime);

    const selectedModel = modelSelect ? modelSelect.value : DEFAULT_MODEL;

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                aspect_ratio: aspectRatioSelect.value,
                image_size: imageSizeSelect.value,
                thinking_level: thinkingToggle.checked ? 'HIGH' : 'MINIMAL',
                model: selectedModel,
            }),
        });

        const data = await response.json();
        stopCountdown();

        if (!response.ok) {
            throw new Error(data.error || '生成失败');
        }

        showStatus('图片生成成功！', 'success');
        showPreview(getImageUrl(data.filename), prompt);
        promptInput.value = '';
        loadHistory();

    } catch (error) {
        stopCountdown();
        showStatus(error.message, 'error');
        loadHistory();
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
    }
}

async function regenerateImage(imageId, prompt, aspectRatio, imageSize, thinkingLevel, model) {
    if (!prompt.trim()) {
        alert('请输入提示词');
        return;
    }

    try {
        const response = await fetch('/regenerate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                image_id: imageId,
                aspect_ratio: aspectRatio || '1:1',
                image_size: imageSize || '1K',
                thinking_level: thinkingLevel || 'MINIMAL',
                model: model || DEFAULT_MODEL,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '生成失败');
        }

        loadHistory();

    } catch (error) {
        alert(error.message);
    }
}

generateBtn.addEventListener('click', generateImage);

promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        generateImage();
    }
});

smartOptimizeBtn.addEventListener('click', smartOptimizePrompt);

checkAuth().then(() => {
    if (currentUser) loadHistory();
});
