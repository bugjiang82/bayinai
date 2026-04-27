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

function getImageUrl(filename) {
    if (!currentUser || !filename) return '';
    return `/data/${currentUser.id}/images/${filename}`;
}

function getThumbnailUrl(filename) {
    if (!currentUser || !filename) return '';
    return `/data/${currentUser.id}/images/${filename}`;
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
const imageList = document.getElementById('image-list');
const imageCountNum = document.getElementById('image-count-num');
const addMoreBtn = document.getElementById('add-more-btn');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const resultImage = document.getElementById('result-image');
const historyGrid = document.getElementById('history-grid');
const uploadProgress = document.getElementById('upload-progress');
const dropHint = document.getElementById('drop-hint');
const uploadAreaContainer = document.querySelector('.upload-area-container');

let selectedFiles = [];
const MAX_IMAGES = 14;

function showUploadProgress(percent, status) {
    if (!uploadProgress) return;
    uploadProgress.style.display = 'block';
    uploadProgress.classList.remove('success', 'error');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    const progressText = uploadProgress.querySelector('.progress-text');
    const progressStatus = uploadProgress.querySelector('.progress-status');
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = percent + '%';
    if (progressStatus) progressStatus.textContent = status;
}

function showUploadSuccess(status) {
    if (!uploadProgress) return;
    uploadProgress.classList.remove('error');
    uploadProgress.classList.add('success');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    const progressText = uploadProgress.querySelector('.progress-text');
    const progressStatus = uploadProgress.querySelector('.progress-status');
    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    if (progressStatus) progressStatus.textContent = status || '上传成功';
    setTimeout(() => {
        if (uploadProgress) uploadProgress.style.display = 'none';
    }, 2000);
}

function showUploadError(status) {
    if (!uploadProgress) return;
    uploadProgress.classList.remove('success');
    uploadProgress.classList.add('error');
    const progressStatus = uploadProgress.querySelector('.progress-status');
    if (progressStatus) progressStatus.textContent = status || '上传失败';
}

function hideUploadProgress() {
    if (!uploadProgress) return;
    uploadProgress.style.display = 'none';
}

async function uploadWithProgress(formData, uploadUrl) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                showUploadProgress(percent, '上传中...');
            }
        });
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    showUploadSuccess('上传成功');
                    resolve(data);
                } catch (e) {
                    showUploadSuccess('完成');
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    const data = JSON.parse(xhr.responseText);
                    showUploadError(data.error || '上传失败');
                } catch (e) {
                    showUploadError('上传失败');
                }
                reject(new Error('Upload failed'));
            }
        });
        xhr.addEventListener('error', () => {
            showUploadError('网络错误');
            reject(new Error('Network error'));
        });
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
    });
}

function loadSettings() {
    const savedPrompt = localStorage.getItem('nano_upload_prompt');
    const savedAspect = localStorage.getItem('nano_upload_aspect_ratio');
    const savedSize = localStorage.getItem('nano_upload_image_size');
    const savedModel = localStorage.getItem('nano_upload_model');
    const savedThinking = localStorage.getItem('nano_upload_thinking');

    if (savedPrompt !== null) promptInput.value = savedPrompt;
    if (savedAspect !== null) aspectRatioSelect.value = savedAspect;
    if (savedSize !== null) imageSizeSelect.value = savedSize;
    if (savedModel !== null) {
        const optionExists = Array.from(modelSelect.options).some(opt => opt.value === savedModel);
        if (optionExists) {
            modelSelect.value = savedModel;
        }
    }

    if (modelSelect.value === 'gemini-3-pro-image-preview') {
        thinkingToggle.checked = false;
        thinkingToggle.disabled = true;
        thinkingLabel.textContent = 'Not Supported';
        thinkingLabel.style.color = '#999';
    } else if (savedThinking === 'true') {
        thinkingToggle.checked = true;
        thinkingLabel.textContent = 'High';
    }
}

function saveSettings() {
    localStorage.setItem('nano_upload_prompt', promptInput.value);
    localStorage.setItem('nano_upload_aspect_ratio', aspectRatioSelect.value);
    localStorage.setItem('nano_upload_image_size', imageSizeSelect.value);
    localStorage.setItem('nano_upload_model', modelSelect.value);
    localStorage.setItem('nano_upload_thinking', thinkingToggle.checked);
}

loadSettings();

thinkingToggle.addEventListener('change', () => {
    thinkingLabel.textContent = thinkingToggle.checked ? 'High' : 'Minimal';
    saveSettings();
});

aspectRatioSelect.addEventListener('change', saveSettings);
imageSizeSelect.addEventListener('change', saveSettings);
modelSelect.addEventListener('change', () => {
    if (modelSelect.value === 'gemini-3-pro-image-preview') {
        thinkingToggle.checked = false;
        thinkingToggle.disabled = true;
        thinkingLabel.textContent = 'Not Supported';
        thinkingLabel.style.color = '#999';
    } else {
        thinkingToggle.disabled = false;
        thinkingLabel.style.color = '';
        const savedThinking = localStorage.getItem('nano_upload_thinking');
        if (savedThinking === 'true') {
            thinkingToggle.checked = true;
            thinkingLabel.textContent = 'High';
        } else {
            thinkingLabel.textContent = 'Minimal';
        }
    }
    saveSettings();
});
promptInput.addEventListener('change', saveSettings);

addMoreBtn.addEventListener('click', () => {
    if (selectedFiles.length < MAX_IMAGES) {
        fileInput.click();
    }
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - selectedFiles.length;
    const filesToAdd = files.slice(0, remaining);

    filesToAdd.forEach(file => {
        if (file.type.startsWith('image/')) {
            selectedFiles.push(file);
        }
    });

    renderImageList();
    updateGenerateButton();
    fileInput.value = '';
});

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadAreaContainer) uploadAreaContainer.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    const remaining = MAX_IMAGES - selectedFiles.length;
    const filesToAdd = files.slice(0, remaining).filter(file => file.type.startsWith('image/'));

    filesToAdd.forEach(file => {
        selectedFiles.push(file);
    });

    renderImageList();
    updateGenerateButton();
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadAreaContainer) uploadAreaContainer.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadAreaContainer) uploadAreaContainer.classList.remove('drag-over');
}

if (uploadAreaContainer) {
    uploadAreaContainer.addEventListener('drop', handleDrop);
    uploadAreaContainer.addEventListener('dragover', handleDragOver);
    uploadAreaContainer.addEventListener('dragleave', handleDragLeave);
} else {
    imageList.addEventListener('drop', handleDrop);
    imageList.addEventListener('dragover', handleDragOver);
    imageList.addEventListener('dragleave', handleDragLeave);
}

function renderImageList() {
    imageList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'image-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = `Image ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeImage(index);
        };

        const number = document.createElement('div');
        number.className = 'number';
        number.textContent = `#${index + 1}`;

        item.appendChild(img);
        item.appendChild(removeBtn);
        item.appendChild(number);
        imageList.appendChild(item);
    });

    if (selectedFiles.length < MAX_IMAGES) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-more-btn';
        addBtn.innerHTML = '<span class="icon">+</span><span class="text">添加图片</span>';
        addBtn.onclick = () => fileInput.click();
        imageList.appendChild(addBtn);
    }

    imageCountNum.textContent = selectedFiles.length;

    if (dropHint) {
        if (selectedFiles.length > 0) {
            dropHint.classList.add('hidden');
        } else {
            dropHint.classList.remove('hidden');
        }
    }
}

function removeImage(index) {
    selectedFiles.splice(index, 1);
    renderImageList();
    updateGenerateButton();
}

function updateGenerateButton() {
    generateBtn.disabled = selectedFiles.length === 0;
}

async function loadHistory() {
    try {
        const response = await fetch('/history?source_type=image');
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
            if (promptInput) {
                promptInput.value = item.prompt || '';
                promptInput.focus();
            }
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

            showStatus('已删除', 'success');
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
    resultImage.src = src;
    resultImage.alt = prompt;
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
        const response = await fetch('/api/optimize-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || '优化失败');
        }

        promptInput.value = data.optimized_prompt;
        showStatus('优化成功！', 'success');

    } catch (error) {
        showStatus(error.message, 'error');
    } finally {
        smartOptimizeBtn.disabled = false;
        smartOptimizeBtn.querySelector('span').innerHTML = '✨ 智能优化';
    }
}

async function generateImage() {
    if (selectedFiles.length === 0) {
        showStatus('请先上传图片', 'error');
        return;
    }

    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatus('请输入描述', 'error');
        return;
    }

    generateBtn.disabled = true;
    showStatus('正在生成...', 'loading');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
        formData.append('images', file);
    });
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', aspectRatioSelect.value);
    formData.append('image_size', imageSizeSelect.value);
    formData.append('thinking_level', thinkingToggle.checked ? 'HIGH' : 'MINIMAL');
    formData.append('model', modelSelect.value);

    try {
        const data = await uploadWithProgress(formData, '/generate_from_image');

        showStatus('图片生成成功！', 'success');
        resultImage.src = getImageUrl(data.filename);
        previewSection.style.display = 'block';

        promptInput.value = '';
        selectedFiles = [];
        renderImageList();
        updateGenerateButton();
        loadHistory();

    } catch (error) {
        showStatus(error.message || '生成失败', 'error');
    } finally {
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
                model: model || 'gemini-3.1-flash-image-preview',
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
smartOptimizeBtn.addEventListener('click', smartOptimizePrompt);

checkAuth().then(() => {
    if (currentUser) loadHistory();
});