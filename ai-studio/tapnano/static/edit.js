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

const canvasContainer = document.getElementById('canvas-container');
const imageCanvas = document.getElementById('image-canvas');
const drawCanvas = document.getElementById('draw-canvas');
const imagePlaceholder = document.getElementById('image-placeholder');
const maskPreviewCanvas = document.getElementById('mask-preview-canvas');
const brushTool = document.getElementById('brush-tool');
const eraserTool = document.getElementById('eraser-tool');
const brushSizeInput = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const clearBtn = document.getElementById('clear-btn');
const applyEditBtn = document.getElementById('apply-edit-btn');
const editPromptInput = document.getElementById('edit-prompt');
const historyGrid = document.getElementById('history-grid');

const imageCtx = imageCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');
const maskCtx = maskPreviewCanvas.getContext('2d');

let currentImage = null;
let currentImageData = null;
let currentFilename = null;
let isDrawing = false;
let currentTool = 'brush';
let brushSize = 30;
let lastX = 0;
let lastY = 0;

const undoStack = [];
const redoStack = [];
const MAX_UNDO = 50;

function loadHistory() {
    fetch('/history?source_type=edit')
        .then(res => res.json())
        .then(history => renderHistory(history));
}

function renderHistory(history) {
    historyGrid.innerHTML = '';
    if (history.length === 0) {
        historyGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">暂无生成记录</p>';
        return;
    }
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <img src="${getThumbnailUrl(item.filename)}" alt="${item.prompt}">
            <div class="info">
                <div class="prompt">${item.prompt}</div>
                <div class="meta">${item.aspect_ratio} | ${item.image_size}</div>
            </div>
        `;
        div.addEventListener('click', () => loadImageForEdit(item.filename));
        historyGrid.appendChild(div);
    });
}

function loadImageForEdit(filename) {
    currentFilename = filename;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        currentImage = img;
        setupCanvas(img);
        clearHistory();
        currentImageData = imageCanvas.toDataURL('image/png');
    };
    img.src = getImageUrl(filename);
}

function setupCanvas(img) {
    const maxWidth = 800;
    const maxHeight = 600;
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
    }

    imageCanvas.width = width;
    imageCanvas.height = height;
    drawCanvas.width = width;
    drawCanvas.height = height;
    maskPreviewCanvas.width = 120;
    maskPreviewCanvas.height = Math.round((height / width) * 120);

    imageCtx.drawImage(img, 0, 0, width, height);

    canvasContainer.classList.add('active');
    imagePlaceholder.style.display = 'none';

    updateMaskPreview();
    updateApplyButton();
}

brushTool.addEventListener('click', () => {
    currentTool = 'brush';
    brushTool.classList.add('active');
    eraserTool.classList.remove('active');
    drawCanvas.style.cursor = 'crosshair';
});

eraserTool.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserTool.classList.add('active');
    brushTool.classList.remove('active');
    drawCanvas.style.cursor = 'cell';
});

brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = `${brushSize}px`;
});

function getCanvasCoords(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    saveState();
    isDrawing = true;
    const coords = getCanvasCoords(e);
    lastX = coords.x;
    lastY = coords.y;
    drawCtx.beginPath();
    drawCtx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
    if (currentTool === 'eraser') {
        drawCtx.globalCompositeOperation = 'destination-out';
    } else {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    }
    drawCtx.fill();
}

function draw(e) {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(coords.x, coords.y);
    drawCtx.strokeStyle = currentTool === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(255, 0, 0, 0.5)';
    drawCtx.lineWidth = brushSize;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    if (currentTool === 'eraser') {
        drawCtx.globalCompositeOperation = 'destination-out';
    } else {
        drawCtx.globalCompositeOperation = 'source-over';
    }
    drawCtx.stroke();
    lastX = coords.x;
    lastY = coords.y;
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        updateMaskPreview();
        updateApplyButton();
    }
}

drawCanvas.addEventListener('mousedown', startDrawing);
drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', stopDrawing);
drawCanvas.addEventListener('mouseleave', stopDrawing);

drawCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
});
drawCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY });
});
drawCanvas.addEventListener('touchend', stopDrawing);

function saveState() {
    const state = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    undoStack.push(state);
    if (undoStack.length > MAX_UNDO) {
        undoStack.shift();
    }
    redoStack.length = 0;
    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length === 0) return;
    const currentState = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    redoStack.push(currentState);
    const previousState = undoStack.pop();
    drawCtx.putImageData(previousState, 0, 0);
    updateUndoRedoButtons();
    updateMaskPreview();
    updateApplyButton();
}

function redo() {
    if (redoStack.length === 0) return;
    const currentState = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    undoStack.push(currentState);
    const nextState = redoStack.pop();
    drawCtx.putImageData(nextState, 0, 0);
    updateUndoRedoButtons();
    updateMaskPreview();
    updateApplyButton();
}

function clearCanvas() {
    if (undoStack.length === 0) return;
    saveState();
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    updateMaskPreview();
    updateApplyButton();
}

function clearHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    updateUndoRedoButtons();
    updateMaskPreview();
    updateApplyButton();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
clearBtn.addEventListener('click', clearCanvas);

function updateMaskPreview() {
    maskCtx.clearRect(0, 0, maskPreviewCanvas.width, maskPreviewCanvas.height);
    maskCtx.drawImage(drawCanvas, 0, 0, maskPreviewCanvas.width, maskPreviewCanvas.height);
}

function updateApplyButton() {
    const hasDrawing = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data.some((val, i) => i % 4 === 3 && val > 0);
    applyEditBtn.disabled = !hasDrawing || !currentImage;
}

function generateMask() {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = drawCanvas.width;
    maskCanvas.height = drawCanvas.height;
    const maskCtx2 = maskCanvas.getContext('2d');

    maskCtx2.drawImage(drawCanvas, 0, 0);
    const imageData = maskCtx2.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
        } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
        }
    }

    maskCtx2.putImageData(imageData, 0, 0);
    return maskCanvas.toDataURL('image/png');
}

async function applyEdit() {
    const prompt = editPromptInput.value.trim();
    if (!prompt) {
        alert('请输入修改描述');
        return;
    }
    if (!currentImage) {
        alert('请先选择要编辑的图片');
        return;
    }

    applyEditBtn.disabled = true;
    applyEditBtn.textContent = '处理中...';

    try {
        const originalData = currentImageData.split(',')[1];
        const maskData = generateMask().split(',')[1];

        const response = await fetch('/edit_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_image: originalData,
                mask: maskData,
                prompt: prompt,
                filename: currentFilename
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '编辑失败');
        }

        const img = new Image();
        img.onload = () => {
            currentImage = img;
            setupCanvas(img);
            clearHistory();
            currentImageData = imageCanvas.toDataURL('image/png');
            editPromptInput.value = '';
        };
        img.src = getImageUrl(result.filename);
        loadHistory();

    } catch (error) {
        alert(error.message);
    } finally {
        applyEditBtn.disabled = false;
        applyEditBtn.textContent = '应用修改';
    }
}

applyEditBtn.addEventListener('click', applyEdit);

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            redo();
        } else {
            undo();
        }
    }
});

checkAuth().then(() => {
    if (currentUser) loadHistory();
});