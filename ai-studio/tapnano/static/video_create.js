let currentUser = null;

const firstFrameInput = document.getElementById('first-frame-input');
const lastFrameInput = document.getElementById('last-frame-input');
const firstFrameArea = document.getElementById('first-frame-area');
const lastFrameArea = document.getElementById('last-frame-area');
const firstFramePlaceholder = document.getElementById('first-frame-placeholder');
const lastFramePlaceholder = document.getElementById('last-frame-placeholder');
const firstFramePreview = document.getElementById('first-frame-preview');
const lastFramePreview = document.getElementById('last-frame-preview');
const firstFrameImg = document.getElementById('first-frame-img');
const lastFrameImg = document.getElementById('last-frame-img');
const firstFrameRemove = document.getElementById('first-frame-remove');
const lastFrameRemove = document.getElementById('last-frame-remove');
const promptInput = document.getElementById('prompt');
const durationSelect = document.getElementById('duration');
const videoModelSelect = document.getElementById('video_model');
const generateBtn = document.getElementById('generate-btn');
const statusText = document.getElementById('status');
const previewSection = document.getElementById('preview-section');
const resultVideo = document.getElementById('result-video');
const downloadBtn = document.getElementById('download-btn');
const videoProgressSection = document.getElementById('video-progress-section');
const progressBar = document.getElementById('video-progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercentage = document.getElementById('progress-percentage');
const progressStatus = document.getElementById('progress-status');
const historyGrid = document.getElementById('history-grid');

let firstFrameData = null;
let lastFrameData = null;
let isGenerating = false;
let currentTaskId = null;
let pollingInterval = null;

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

function setupDragAndDrop(area, input, placeholder, preview, imgElement, frameDataObj, frameType) {
    area.addEventListener('click', () => {
        if (!preview.style.display || preview.style.display === 'none') {
            input.click();
        }
    });

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', () => {
        area.classList.remove('drag-over');
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0], imgElement, preview, placeholder, frameDataObj, frameType);
        }
    });

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], imgElement, preview, placeholder, frameDataObj, frameType);
        }
    });
}

function handleFile(file, imgElement, preview, placeholder, frameDataObj, frameType) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showStatus('请上传 JPG、PNG 或 WebP 格式的图片', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showStatus('图片大小不能超过 10MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        imgElement.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        frameDataObj.data = e.target.result;
        frameDataObj.type = frameType;
        updateGenerateButton();
    };
    reader.readAsDataURL(file);
}

function removeFrame(placeholder, preview, frameDataObj) {
    placeholder.style.display = 'block';
    preview.style.display = 'none';
    frameDataObj.data = null;
    frameDataObj.type = null;
    updateGenerateButton();
}

firstFrameRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFrame(firstFramePlaceholder, firstFramePreview, firstFrameData);
    firstFrameInput.value = '';
});

lastFrameRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFrame(lastFramePlaceholder, lastFramePreview, lastFrameData);
    lastFrameInput.value = '';
});

function updateGenerateButton() {
    generateBtn.disabled = !(firstFrameData.data && lastFrameData.data) || isGenerating;
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

function getVideoUrl(filename) {
    if (!currentUser || !filename) return '';
    return `/data/${currentUser.id}/videos/${filename}`;
}

async function loadHistory() {
    try {
        const response = await fetch('/api/video/history');
        const data = await response.json();

        if (data.success) {
            renderHistory(data.videos || []);
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

function renderHistory(videos) {
    historyGrid.innerHTML = '';

    if (videos.length === 0) {
        historyGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">暂无视频记录</p>';
        return;
    }

    videos.forEach(video => {
        const div = document.createElement('div');
        div.className = 'history-item';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';

        const thumbnail = document.createElement('img');
        thumbnail.src = video.thumbnail_url || '/static/video-placeholder.png';
        thumbnail.alt = video.prompt || '视频';
        thumbnail.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'info';

        const promptDiv = document.createElement('div');
        promptDiv.className = 'prompt';
        promptDiv.textContent = video.prompt || '无描述';
        promptDiv.title = video.prompt || '无描述';

        const metaDiv = document.createElement('div');
        metaDiv.className = 'meta';
        const timeStr = video.created_at ? new Date(video.created_at).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';
        metaDiv.innerHTML = `<span>${video.duration || 5}秒</span><span>${timeStr}</span>`;

        info.appendChild(promptDiv);
        info.appendChild(metaDiv);
        imgContainer.appendChild(thumbnail);
        div.appendChild(imgContainer);
        div.appendChild(info);

        thumbnail.addEventListener('click', () => {
            showPreview(getVideoUrl(video.filename), video.prompt);
        });

        historyGrid.appendChild(div);
    });
}

function showPreview(src, prompt) {
    resultVideo.src = src;
    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

downloadBtn.addEventListener('click', () => {
    if (resultVideo.src) {
        const a = document.createElement('a');
        a.href = resultVideo.src;
        a.download = `video_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

async function generateVideo() {
    if (isGenerating) return;

    if (!firstFrameData.data || !lastFrameData.data) {
        showStatus('请上传起始帧和结束帧', 'error');
        return;
    }

    isGenerating = true;
    generateBtn.disabled = true;
    showStatus('正在提交视频生成任务...', 'loading');
    videoProgressSection.style.display = 'block';
    updateProgress(0, '正在提交任务...', '正在连接服务器...');

    const prompt = promptInput.value.trim();
    const resolution = document.getElementById('resolution').value;
    const duration = parseInt(document.getElementById('duration').value);
    const promptExtend = document.getElementById('prompt_extend').checked;
    const model = videoModelSelect.value;

    try {
        const response = await fetch('/api/video/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                first_frame: firstFrameData.data,
                last_frame: lastFrameData.data,
                prompt: prompt,
                resolution: resolution,
                duration: duration,
                prompt_extend: promptExtend,
                model: model
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '提交任务失败');
        }

        currentTaskId = data.task_id;
        showStatus('视频生成中，请耐心等待...', 'loading');
        startPolling();

    } catch (error) {
        isGenerating = false;
        generateBtn.disabled = false;
        showStatus(error.message, 'error');
        videoProgressSection.style.display = 'none';
    }
}

function startPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/video/status/${currentTaskId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '查询状态失败');
            }

            updateProgress(data.progress || 0, getStatusText(data.status), data.message || '');

            if (data.status === 'completed') {
                clearInterval(pollingInterval);
                pollingInterval = null;
                handleVideoCompleted(data);
            } else if (data.status === 'failed') {
                clearInterval(pollingInterval);
                pollingInterval = null;
                handleVideoFailed(data.message || '视频生成失败');
            }

        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
}

function getStatusText(status) {
    const statusMap = {
        'pending': '等待中',
        'processing': '生成中',
        'completed': '已完成',
        'failed': '失败'
    };
    return statusMap[status] || status;
}

function updateProgress(progress, status, message) {
    progressBar.style.width = `${progress}%`;
    progressPercentage.textContent = `${progress}%`;
    progressText.textContent = status;
    progressStatus.textContent = message || '';
}

function handleVideoCompleted(data) {
    isGenerating = false;
    generateBtn.disabled = false;
    showStatus('视频生成成功！', 'success');

    if (data.video_url) {
        showPreview(data.video_url, promptInput.value.trim());
    }

    loadHistory();

    setTimeout(() => {
        videoProgressSection.style.display = 'none';
    }, 3000);
}

function handleVideoFailed(message) {
    isGenerating = false;
    generateBtn.disabled = false;
    showStatus(`视频生成失败: ${message}`, 'error');
    videoProgressSection.style.display = 'none';
}

generateBtn.addEventListener('click', generateVideo);

firstFrameData = { data: null, type: 'first' };
lastFrameData = { data: null, type: 'last' };

setupDragAndDrop(firstFrameArea, firstFrameInput, firstFramePlaceholder, firstFramePreview, firstFrameImg, firstFrameData, 'first');
setupDragAndDrop(lastFrameArea, lastFrameInput, lastFramePlaceholder, lastFramePreview, lastFrameImg, lastFrameData, 'last');

checkAuth().then(() => {
    if (currentUser) loadHistory();
});
