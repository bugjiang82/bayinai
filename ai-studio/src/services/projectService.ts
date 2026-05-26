export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  canvasData: {
    nodes: unknown[];
    edges: unknown[];
  };
  thumbnail: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

class ProjectService {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || '请求失败');
    }

    return result.data;
  }

  async list(): Promise<ProjectDTO[]> {
    const data = await this.request<{ projects: ProjectDTO[] }>('/api/workflow/projects');
    return data.projects;
  }

  async get(id: string): Promise<ProjectDTO> {
    const data = await this.request<{ project: ProjectDTO }>(`/api/workflow/projects/${id}`);
    return data.project;
  }

  async create(params: {
    name: string;
    description?: string;
    canvasData?: unknown;
    thumbnail?: string;
    isDraft?: boolean;
  }): Promise<ProjectDTO> {
    const data = await this.request<{ project: ProjectDTO }>('/api/workflow/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        description: params.description || '',
        canvasData: params.canvasData || { nodes: [], edges: [] },
        thumbnail: params.thumbnail || null,
        isDraft: params.isDraft !== undefined ? params.isDraft : false,
      }),
    });
    return data.project;
  }

  async update(
    id: string,
    params: {
      name?: string;
      description?: string;
      canvasData?: unknown;
      thumbnail?: string;
      isDraft?: boolean;
    }
  ): Promise<ProjectDTO> {
    const data = await this.request<{ project: ProjectDTO }>(`/api/workflow/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
    return data.project;
  }

  async delete(id: string): Promise<void> {
    await this.request<{ message: string }>(`/api/workflow/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

export const projectService = new ProjectService();