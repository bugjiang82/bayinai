const TemplateAPI = {
    async getTemplates(params = {}) {
        const query = new URLSearchParams({
            category: params.category || '全部',
            search: params.search || '',
            page: params.page || 1,
            limit: params.limit || 20
        });
        const response = await fetch(`/api/templates?${query}`);
        return response.json();
    },

    async getTemplate(templateId) {
        const response = await fetch(`/api/templates/${templateId}`);
        return response.json();
    },

    async getCategories() {
        const response = await fetch('/api/templates/categories');
        return response.json();
    },

    async getFavorites() {
        const response = await fetch('/api/templates/favorites');
        return response.json();
    },

    async addFavorite(templateId) {
        const response = await fetch('/api/templates/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_id: templateId })
        });
        return response.json();
    },

    async removeFavorite(templateId) {
        const response = await fetch('/api/templates/favorites', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_id: templateId })
        });
        return response.json();
    },

    async useTemplate(templateId, taskId = null) {
        const response = await fetch(`/api/templates/${templateId}/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId })
        });
        return response.json();
    },

    getImageUrl(imagePath, type = 'examples') {
        if (!imagePath) return '';
        const filename = imagePath.split('/').pop();
        const numMatch = filename.match(/(\d+)/);
        const num = numMatch ? numMatch[1] : filename;
        return `/static/template-images/${type}/${num}.jpg`;
    }
};

window.TemplateAPI = TemplateAPI;
