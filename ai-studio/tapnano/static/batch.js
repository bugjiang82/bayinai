// ============================================
// Batch task management v3
// ============================================
var currentUser = null;
var configRefImages = [];
var tableTasks = [];
var taskIdCounter = 1001;

function getImageUrl(filename) {
    if (!currentUser || !filename) return '';
    return '/data/' + currentUser.id + '/images/' + filename;
}

function showUploadProgress(percent, status) {
    var el = document.getElementById('upload-progress');
    if (!el) return;
    el.style.display = 'block';
    el.classList.remove('success', 'error');
    var bar = el.querySelector('.progress-bar');
    var text = el.querySelector('.progress-text');
    var statusEl = el.querySelector('.progress-status');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
    if (statusEl) statusEl.textContent = status;
}

function showUploadSuccess(status) {
    var el = document.getElementById('upload-progress');
    if (!el) return;
    el.classList.remove('error');
    el.classList.add('success');
    var bar = el.querySelector('.progress-bar');
    var text = el.querySelector('.progress-text');
    var statusEl = el.querySelector('.progress-status');
    if (bar) bar.style.width = '100%';
    if (text) text.textContent = '100%';
    if (statusEl) statusEl.textContent = status || '上传成功';
    setTimeout(function() { el.style.display = 'none'; }, 2000);
}

function showUploadError(status) {
    var el = document.getElementById('upload-progress');
    if (!el) return;
    el.classList.remove('success');
    el.classList.add('error');
    var statusEl = el.querySelector('.progress-status');
    if (statusEl) statusEl.textContent = status || '上传失败';
}

// ============================================
// Toast
// ============================================
function showToast(message, type) {
    type = type || 'info';
    var el = document.getElementById('toast');
    if (!el) { console.log('Toast:', type, message); return; }
    el.textContent = message;
    el.className = 'toast ' + type;
    requestAnimationFrame(function() { el.classList.add('show'); });
    if (type !== 'loading') {
        setTimeout(function() { el.classList.remove('show'); }, 3000);
    }
}

// ============================================
// Auth
// ============================================
async function checkAuth() {
    try {
        var r = await fetch('/api/auth_status');
        var d = await r.json();
        if (!d.authenticated) { window.location.href = '/login'; return null; }
        currentUser = d.user;
        console.log('Auth OK, user:', currentUser);
        return currentUser;
    } catch (e) { window.location.href = '/login'; return null; }
}

// ============================================
// Reference image upload
// ============================================
async function doUploadRefImage(file) {
    return new Promise(function(resolve, reject) {
        var fd = new FormData();
        fd.append('file', file);
        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percent = Math.round((e.loaded / e.total) * 100);
                showUploadProgress(percent, '上传中... (' + percent + '%)');
            }
        });
        xhr.addEventListener('load', function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var d = JSON.parse(xhr.responseText);
                    if (d.upload_id) {
                        configRefImages.push({ upload_id: d.upload_id, url: d.url });
                        showUploadSuccess('上传成功');
                        resolve(d);
                    } else {
                        showUploadError('上传失败');
                        reject(new Error('No upload_id'));
                    }
                } catch (e) {
                    showUploadError('解析错误');
                    reject(e);
                }
            } else {
                try {
                    var d = JSON.parse(xhr.responseText);
                    showUploadError(d.error || '上传失败');
                } catch (e) {
                    showUploadError('上传失败');
                }
                reject(new Error('Upload failed'));
            }
        });
        xhr.addEventListener('error', function() {
            showUploadError('网络错误');
            reject(new Error('Network error'));
        });
        xhr.open('POST', '/api/uploads');
        xhr.send(fd);
    });
}

function renderRefImages() {
    var container = document.getElementById('config-ref-images');
    if (!container) return;

    var html = '';
    for (var i = 0; i < configRefImages.length; i++) {
        html += '<div class="ref-thumb">' +
            '<img src="' + configRefImages[i].url + '" alt="ref">' +
            '<button class="remove-ref-thumb" type="button" onclick="removeRefImg(' + i + ')">&times;</button>' +
            '</div>';
    }
    if (configRefImages.length < 14) {
        html += '<div class="upload-btn-box">' +
            '<div class="icon">+</div>' +
            '<div class="text">上传参考图</div>' +
            '<input type="file" id="config-ref-upload" accept="image/*" multiple>' +
            '</div>';
    }
    container.innerHTML = html;

    var inp = document.getElementById('config-ref-upload');
    if (inp) {
        inp.onchange = function() {
            var files = this.files;
            if (!files || !files.length) return;
            var filesArr = [];
            for (var i = 0; i < files.length; i++) filesArr.push(files[i]);
            this.value = '';
            Promise.all(filesArr.map(doUploadRefImage)).then(function() {
                renderRefImages();
            });
        };
    }
}

function removeRefImg(idx) {
    configRefImages.splice(idx, 1);
    renderRefImages();
}

// ============================================
// Task management
// ============================================
function addTaskToTable() {
    console.log('addTaskToTable called!');
    console.log('Prompt:', document.getElementById('config-prompt').value);

    var prompt = document.getElementById('config-prompt').value.trim();
    if (!prompt) { showToast('请输入提示词', 'error'); return; }

    var ratio = document.getElementById('config-ratio').value;
    var quality = document.getElementById('config-quality').value;
    var model = document.getElementById('config-model').value;
    var h = parseInt(document.getElementById('config-delay-hours').value) || 0;
    var m = parseInt(document.getElementById('config-delay-minutes').value) || 0;

    var task = {
        id: taskIdCounter++,
        refImages: configRefImages.slice(),
        prompt: prompt,
        ratio: ratio,
        quality: quality,
        model: model,
        delayHours: h,
        delayMinutes: m
    };

    tableTasks.push(task);
    console.log('Task added:', task);
    console.log('Total tasks:', tableTasks.length);

    renderTaskTable();
    showToast('任务 #' + task.id + ' 已添加到队列', 'success');
}

function removeTask(id) {
    tableTasks = tableTasks.filter(function(t) { return t.id !== id; });
    renderTaskTable();
}

function renderTaskTable() {
    var tbody = document.getElementById('task-list');
    var countEl = document.getElementById('task-count');
    console.log('renderTaskTable called, tasks:', tableTasks.length);
    if (!tbody) { console.log('ERR: task-list not found'); return; }

    if (countEl) countEl.textContent = tableTasks.length;

    if (tableTasks.length === 0) {
        tbody.innerHTML = '<tr class="empty-state-row"><td colspan="8">' +
            '<div class="empty-state-icon">&#128203;</div>' +
            '<div class="empty-state-text">暂无任务，请在左侧添加</div>' +
            '</td></tr>';
        return;
    }

    var rows = [];
    for (var t = 0; t < tableTasks.length; t++) {
        var task = tableTasks[t];

        var timeStr = (task.delayHours === 0 && task.delayMinutes === 0)
            ? '立即执行'
            : task.delayHours + '小时' + task.delayMinutes + '分钟';

        var refHtml;
        if (task.refImages.length > 0) {
            refHtml = '<div class="task-preview-imgs">';
            for (var ri = 0; ri < task.refImages.length; ri++) {
                refHtml += '<img src="' + task.refImages[ri].url + '" alt="">';
            }
            refHtml += '</div>';
        } else {
            refHtml = '<span style="color:var(--text-muted);font-size:0.75rem;">无</span>';
        }

        var promptText = task.prompt.length > 25
            ? task.prompt.substring(0, 25) + '...'
            : task.prompt;

        var modelLabel = task.model.indexOf('flash') >= 0 ? 'Banana2' :
                         task.model.indexOf('pro') >= 0 ? 'Banana Pro' : task.model;

        rows.push('<tr>' +
            '<td class="task-id-cell">#' + task.id + '</td>' +
            '<td>' + refHtml + '</td>' +
            '<td class="prompt-cell" title="' + task.prompt.replace(/"/g, '&quot;') + '">' + promptText + '</td>' +
            '<td class="meta-cell">' + task.ratio + '</td>' +
            '<td class="meta-cell">' + task.quality + '</td>' +
            '<td class="meta-cell">' + modelLabel + '</td>' +
            '<td class="delay-cell">' + timeStr + '</td>' +
            '<td><button class="delete-task-btn" type="button" onclick="removeTask(' + task.id + ')" title="删除">&#128465;</button></td>' +
            '</tr>');
    }
    tbody.innerHTML = rows.join('');
}

// ============================================
// Submit batch to backend
// ============================================
async function submitBatch() {
    if (tableTasks.length === 0) {
        showToast('请至少添加一个任务', 'error');
        return;
    }

    var btn = document.getElementById('submit-batch-btn');
    btn.disabled = true;
    showToast('正在提交批量任务...', 'loading');

    try {
        var taskList = [];
        for (var t = 0; t < tableTasks.length; t++) {
            var task = tableTasks[t];
            var urls = [];
            for (var ri = 0; ri < task.refImages.length; ri++) {
                urls.push(task.refImages[ri].url);
            }
            taskList.push({
                prompt: task.prompt,
                aspect_ratio: task.ratio,
                image_size: task.quality,
                model: task.model,
                reference_images: urls
            });
        }

        var hours = parseInt(document.getElementById('config-delay-hours').value) || 0;
        var minutes = parseInt(document.getElementById('config-delay-minutes').value) || 0;
        var immediate = (hours === 0 && minutes === 0);

        var response = await fetch('/api/batch/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: taskList, hours: hours, minutes: minutes, immediate: immediate })
        });

        var data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '创建失败');
        }

        showToast('批量任务创建成功！共 ' + tableTasks.length + ' 个任务', 'success');
        tableTasks = [];
        renderTaskTable();
        configRefImages = [];
        renderRefImages();
        document.getElementById('config-prompt').value = '';
        loadBatches();

    } catch (e) {
        console.error('submitBatch error:', e);
        showToast(e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// ============================================
// Load batch list
// ============================================
async function loadBatches() {
    try {
        var r = await fetch('/api/batch/list');
        var d = await r.json();
        renderBatchList(d.batches || []);
    } catch (e) { /* silence */ }
}

function renderBatchList(batches) {
    var el = document.getElementById('batch-list');
    if (!el) return;

    if (batches.length === 0) {
        el.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--text-muted);">暂无历史批量任务</div>';
        return;
    }

    var statusMap = {
        'pending': '等待执行',
        'running': '执行中',
        'completed': '已完成',
        'completed_with_errors': '已完成(有错误)',
        'failed': '失败',
        'cancelled': '已取消'
    };

    var cards = [];
    for (var b = 0; b < batches.length; b++) {
        var batch = batches[b];
        var progress = batch.total > 0 ? Math.round(batch.completed / batch.total * 100) : 0;
        var statusText = statusMap[batch.status] || batch.status;
        var createdText;
        try { createdText = new Date(batch.created_at).toLocaleString('zh-CN'); } catch(e) { createdText = batch.created_at; }

        var actionsHtml = '';
        if (batch.status === 'pending') {
            actionsHtml = '<div class="batch-card-actions">' +
                '<button class="btn-sm btn-run" type="button" onclick="runBatch(\'' + batch.id + '\')">立即执行</button>' +
                '<button class="btn-sm btn-delete" type="button" onclick="deleteBatch(\'' + batch.id + '\')">删除</button>' +
                '</div>';
        } else if (batch.status !== 'completed') {
            actionsHtml = '<div class="batch-card-actions">' +
                '<button class="btn-sm btn-delete" type="button" onclick="deleteBatch(\'' + batch.id + '\')">删除</button>' +
                '</div>';
        }

        var itemsHtml = '';
        if (batch.items && batch.items.length > 0) {
            var itemTextMap = { 'completed': '完成', 'failed': '失败', 'running': '执行中', 'pending': '等待' };
            var rows = [];
            for (var i = 0; i < batch.items.length; i++) {
                var item = batch.items[i];
                var cls = 'pending';
                if (item.status === 'completed') cls = 'completed';
                else if (item.status === 'failed') cls = 'failed';
                else if (item.status === 'running') cls = 'running';
                var txt = itemTextMap[item.status] || item.status;

                var cell = '<span style="color:var(--text-muted);">\u2014</span>';
                if (item.status === 'completed' && item.result_filename) {
                    var imgu = getImageUrl(item.result_filename);
                    cell = '<img src="' + imgu + '" onclick="window.open(\'' + imgu + '\')">';
                } else if (item.status === 'failed') {
                    cell = '<span style="color:var(--error);font-size:0.8rem;">' + (item.error_message || '错误') + '</span>';
                }

                rows.push('<tr>' +
                    '<td><span class="status-badge ' + cls + '">' + txt + '</span></td>' +
                    '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (item.prompt || '\u2014') + '</td>' +
                    '<td class="item-result">' + cell + '</td>' +
                    '</tr>');
            }
            itemsHtml = '<div class="batch-item-table"><details>' +
                '<summary>查看子任务 (' + batch.items.length + ')</summary>' +
                '<table><thead><tr><th>状态</th><th>提示词</th><th>结果</th></tr></thead><tbody>' +
                rows.join('') + '</tbody></table></details></div>';
        }

        cards.push('<div class="batch-card">' +
            '<div class="batch-card-header">' +
                '<span class="batch-card-title">' + batch.total + ' 个任务 \u00B7 ' + createdText + '</span>' +
                '<span class="status-badge ' + batch.status + '">' + statusText + '</span>' +
            '</div>' +
            '<div class="batch-card-progress">' +
                '<div class="batch-card-progress-bar ' + batch.status + '" style="width:' + progress + '%"></div>' +
            '</div>' +
            '<div class="batch-card-stats">' +
                '<span>已完成: ' + batch.completed + '/' + batch.total + '</span>' +
                (batch.failed > 0 ? '<span style="color:var(--error);">失败: ' + batch.failed + '</span>' : '') +
            '</div>' +
            actionsHtml +
            itemsHtml +
            '</div>');
    }
    el.innerHTML = cards.join('');
}

async function runBatch(batchId) {
    try {
        var r = await fetch('/api/batch/' + batchId + '/run', { method: 'POST' });
        var d = await r.json();
        if (!r.ok) throw new Error(d.error || '启动失败');
        showToast('任务已开始执行', 'success');
        setTimeout(loadBatches, 1000);
    } catch (e) { showToast(e.message, 'error'); }
}

async function deleteBatch(batchId) {
    if (!confirm('确定要删除这个批量任务记录吗？')) return;
    try {
        var r = await fetch('/api/batch/' + batchId, { method: 'DELETE' });
        var d = await r.json();
        if (!r.ok) throw new Error(d.error || '删除失败');
        showToast('已删除', 'success');
        loadBatches();
    } catch (e) { showToast(e.message, 'error'); }
}

// ============================================
// Init — runs when this script loads
// ============================================
function initPage() {
    renderRefImages();
    renderTaskTable();

    // Bind add button
    var addBtn = document.getElementById('add-to-table-btn');
    if (addBtn) {
        addBtn.onclick = function() {
            console.log('Button clicked!');
            addTaskToTable();
        };
    } else {
        console.log('ERROR: add-to-table-btn not found!');
    }

    // Bind submit button
    var submitBtn = document.getElementById('submit-batch-btn');
    if (submitBtn) {
        submitBtn.onclick = function() {
            console.log('Submit clicked!');
            submitBatch();
        };
    } else {
        console.log('ERROR: submit-batch-btn not found!');
    }

    console.log('Page initialized with', tableTasks.length, 'configRefImages:', configRefImages.length);
}

// Run immediately (no DOMContentLoaded wrapper needed since script is at bottom of body)
console.log('batch.js loaded, readyState:', document.readyState);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

checkAuth().then(function() {
    if (currentUser) {
        loadBatches();
        var iv = setInterval(loadBatches, 10000);
        window.addEventListener('beforeunload', function() { clearInterval(iv); });
    }
});
