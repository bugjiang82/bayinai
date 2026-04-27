class TemplateModal {
    constructor() {
        this.overlay = null;
        this.currentCategory = '全部';
        this.currentPage = 1;
        this.searchQuery = '';
        this.searchTimeout = null;
        this.categories = [];
        this.templates = [];
        this.init();
    }

    init() {
        this.createOverlay();
        this.bindEvents();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'template-modal-overlay';
        this.overlay.innerHTML = `
            <div class="template-modal">
                <div class="template-modal-header">
                    <h2>📋 提示词模板库</h2>
                    <button class="template-modal-close">&times;</button>
                </div>
                <div class="template-modal-body">
                    <div class="template-search-bar">
                        <div class="template-search-wrapper">
                            <span class="template-search-icon">🔍</span>
                            <input type="text" class="template-search-input" placeholder="搜索模板名称或描述...">
                        </div>
                    </div>
                    <div class="template-category-tabs"></div>
                    <div class="template-grid-container">
                        <div class="template-loading">
                            <div class="template-loading-spinner"></div>
                            <span>加载中...</span>
                        </div>
                    </div>
                </div>
                <div class="template-pagination">
                    <button class="template-pagination-btn" id="template-prev">上一页</button>
                    <span class="template-pagination-info">第 <span id="template-page-num">1</span> / <span id="template-total-pages">1</span> 页</span>
                    <button class="template-pagination-btn" id="template-next">下一页</button>
                </div>
            </div>
            <div class="template-detail-overlay">
                <div class="template-detail-modal">
                    <div class="template-detail-header">
                        <h2>模板详情</h2>
                        <button class="template-modal-close">&times;</button>
                    </div>
                    <div class="template-detail-body">
                        <div class="template-detail-grid">
                            <div class="template-detail-images">
                                <div class="template-detail-image-box">
                                    <div class="template-detail-image-label">原图</div>
                                    <img id="template-detail-original" src="" alt="原图">
                                </div>
                                <div class="template-detail-arrow">⬇️</div>
                                <div class="template-detail-image-box">
                                    <div class="template-detail-image-label">效果图</div>
                                    <img id="template-detail-result" src="" alt="效果图">
                                </div>
                            </div>
                            <div class="template-detail-info">
                                <span class="template-detail-category" id="template-detail-category">建筑专题</span>
                                <h3 class="template-detail-name" id="template-detail-name">模板名称</h3>
                                <div class="template-detail-uses" id="template-detail-uses">
                                    <span>🔥</span>
                                    <span>0</span> 次使用
                                </div>
                                <p class="template-detail-description" id="template-detail-description">模板描述</p>
                                <div class="template-detail-prompt">
                                    <div class="template-detail-prompt-header">
                                        <span class="template-detail-prompt-label">提示词预览</span>
                                        <button class="template-detail-prompt-copy" id="template-copy-prompt">复制</button>
                                    </div>
                                    <div class="template-detail-prompt-content" id="template-detail-prompt"></div>
                                </div>
                                <div class="template-detail-actions">
                                    <button class="template-detail-btn template-detail-btn-favorite" id="template-favorite-btn">
                                        <span>🤍</span> 收藏
                                    </button>
                                    <button class="template-detail-btn template-detail-btn-apply" id="template-apply-btn">
                                        🎨 应用模板
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        this.overlay.querySelector('.template-modal').querySelector('.template-modal-close').addEventListener('click', () => this.close());

        this.overlay.querySelector('.template-modal').addEventListener('click', (e) => {
            if (e.target.closest('.template-modal-close')) {
                this.close();
            }
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        const detailOverlay = this.overlay.querySelector('.template-detail-overlay');
        if (detailOverlay) {
            detailOverlay.querySelector('.template-modal-close').addEventListener('click', () => this.closeDetail());
            detailOverlay.addEventListener('click', (e) => {
                if (e.target === detailOverlay) {
                    this.closeDetail();
                }
            });
        }

        const searchInput = this.overlay.querySelector('.template-search-input');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.loadTemplates();
            }, 300);
        });

        this.overlay.querySelector('#template-prev').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadTemplates();
            }
        });

        this.overlay.querySelector('#template-next').addEventListener('click', () => {
            this.currentPage++;
            this.loadTemplates();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.overlay.querySelector('.template-detail-overlay').classList.contains('active')) {
                    this.closeDetail();
                } else if (this.overlay.classList.contains('active')) {
                    this.close();
                }
            }
        });
    }

    async open() {
        this.overlay.classList.add('active');
        await this.loadCategories();
        await this.loadTemplates();
    }

    close() {
        this.overlay.classList.remove('active');
    }

    closeDetail() {
        this.overlay.querySelector('.template-detail-overlay').classList.remove('active');
    }

    async loadCategories() {
        try {
            const res = await TemplateAPI.getCategories();
            if (res.success) {
                this.categories = res.data;
                this.renderCategories();
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }

    renderCategories() {
        const tabsContainer = this.overlay.querySelector('.template-category-tabs');
        const totalCount = this.categories.reduce((sum, cat) => sum + cat.count, 0);

        let html = `<button class="template-category-tab ${this.currentCategory === '全部' ? 'active' : ''}" data-category="全部">
            全部 <span class="count">${totalCount}</span>
        </button>`;

        for (const cat of this.categories) {
            html += `<button class="template-category-tab ${this.currentCategory === cat.category ? 'active' : ''}" data-category="${cat.category}">
                ${cat.category} <span class="count">${cat.count}</span>
            </button>`;
        }

        tabsContainer.innerHTML = html;

        tabsContainer.querySelectorAll('.template-category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                tabsContainer.querySelectorAll('.template-category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.category;
                this.currentPage = 1;
                this.loadTemplates();
            });
        });
    }

    async loadTemplates() {
        const container = this.overlay.querySelector('.template-grid-container');
        container.innerHTML = `
            <div class="template-loading">
                <div class="template-loading-spinner"></div>
                <span>加载中...</span>
            </div>
        `;

        try {
            const res = await TemplateAPI.getTemplates({
                category: this.currentCategory,
                search: this.searchQuery,
                page: this.currentPage,
                limit: 20
            });

            if (res.success) {
                this.templates = res.data.templates;
                this.renderTemplates(res.data);
            }
        } catch (err) {
            console.error('Failed to load templates:', err);
            container.innerHTML = `
                <div class="template-empty">
                    <div class="template-empty-icon">❌</div>
                    <div class="template-empty-text">加载失败</div>
                </div>
            `;
        }
    }

    renderTemplates(data) {
        const container = this.overlay.querySelector('.template-grid-container');

        if (!data.templates || data.templates.length === 0) {
            container.innerHTML = `
                <div class="template-empty">
                    <div class="template-empty-icon">📭</div>
                    <div class="template-empty-text">暂无模板</div>
                </div>
            `;
            this.updatePagination(data);
            return;
        }

        let html = '<div class="template-grid">';

        for (const t of data.templates) {
            const thumbUrl = t.example_image ? TemplateAPI.getImageUrl(t.example_image, 'thumbnails') : '';
            const isHot = t.use_count > 200;

            html += `
                <div class="template-card" data-id="${t.id}">
                    <div class="template-card-thumb">
                        ${thumbUrl ? `<img src="${thumbUrl}" alt="${t.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22%3E无预览%3C/text%3E%3C/svg%3E'">` : '<div style="aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">无预览</div>'}
                    </div>
                    <div class="template-card-info">
                        <div class="template-card-name" title="${t.name}">${t.name}</div>
                        <div class="template-card-meta">
                            <span>${t.category}</span>
                            <span class="template-card-uses ${isHot ? 'hot' : ''}">🔥 ${t.use_count}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                this.showDetail(id);
            });
        });

        this.updatePagination(data);
    }

    updatePagination(data) {
        const pageNum = this.overlay.querySelector('#template-page-num');
        const totalPages = this.overlay.querySelector('#template-total-pages');
        const prevBtn = this.overlay.querySelector('#template-prev');
        const nextBtn = this.overlay.querySelector('#template-next');

        pageNum.textContent = data.page;
        totalPages.textContent = data.total_pages || 1;
        prevBtn.disabled = data.page <= 1;
        nextBtn.disabled = data.page >= data.total_pages;
    }

    async showDetail(id) {
        const detailOverlay = this.overlay.querySelector('.template-detail-overlay');

        try {
            const res = await TemplateAPI.getTemplate(id);
            if (!res.success) {
                alert('模板不存在');
                return;
            }

            const t = res.data;

            document.getElementById('template-detail-category').textContent = t.category;
            document.getElementById('template-detail-name').textContent = t.name;
            document.getElementById('template-detail-description').textContent = t.description || '暂无描述';

            const usesEl = document.getElementById('template-detail-uses');
            usesEl.innerHTML = `<span>🔥</span><span>${t.use_count}</span> 次使用`;
            usesEl.className = 'template-detail-uses' + (t.use_count > 200 ? ' hot' : '');

            document.getElementById('template-detail-prompt').textContent = t.prompt_template;

            const originalImg = document.getElementById('template-detail-original');
            const resultImg = document.getElementById('template-detail-result');

            if (t.original_image) {
                originalImg.src = TemplateAPI.getImageUrl(t.original_image, 'originals');
            } else {
                originalImg.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22%3E无原图%3C/text%3E%3C/svg%3E';
            }

            if (t.example_image) {
                resultImg.src = TemplateAPI.getImageUrl(t.example_image, 'examples');
            } else {
                resultImg.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2212%22%3E无效果图%3C/text%3E%3C/svg%3E';
            }

            const favBtn = document.getElementById('template-favorite-btn');
            favBtn.innerHTML = t.is_favorited ? '<span>❤️</span> 已收藏' : '<span>🤍</span> 收藏';
            favBtn.className = 'template-detail-btn template-detail-btn-favorite' + (t.is_favorited ? ' active' : '');
            favBtn.dataset.id = t.id;
            favBtn.dataset.favorited = t.is_favorited ? '1' : '0';

            favBtn.onclick = () => this.toggleFavorite(t.id, favBtn);

            document.getElementById('template-copy-prompt').onclick = () => {
                navigator.clipboard.writeText(t.prompt_template).then(() => {
                    alert('提示词已复制');
                });
            };

            document.getElementById('template-apply-btn').onclick = () => {
                this.applyTemplate(t);
            };

            detailOverlay.classList.add('active');

        } catch (err) {
            console.error('Failed to load template detail:', err);
            alert('加载失败');
        }
    }

    async toggleFavorite(id, btn) {
        const isFavorited = btn.dataset.favorited === '1';

        try {
            let res;
            if (isFavorited) {
                res = await TemplateAPI.removeFavorite(id);
            } else {
                res = await TemplateAPI.addFavorite(id);
            }

            if (res.success) {
                const newFavorited = !isFavorited;
                btn.dataset.favorited = newFavorited ? '1' : '0';
                btn.innerHTML = newFavorited ? '<span>❤️</span> 已收藏' : '<span>🤍</span> 收藏';
                btn.className = 'template-detail-btn template-detail-btn-favorite' + (newFavorited ? ' active' : '');
            } else {
                alert(res.error || '操作失败');
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
            alert('操作失败');
        }
    }

    applyTemplate(template) {
        const promptTextarea = document.getElementById('prompt');
        if (promptTextarea) {
            promptTextarea.value = template.prompt_template;
            promptTextarea.focus();
        }

        TemplateAPI.useTemplate(template.id);

        this.closeDetail();
        this.close();
    }
}

let templateModal = null;

function openTemplateModal() {
    if (!templateModal) {
        templateModal = new TemplateModal();
    }
    templateModal.open();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.template-entrance-btn')) {
        document.querySelector('.template-entrance-btn').onclick = openTemplateModal;
    }
});
