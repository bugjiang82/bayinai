import { create } from 'zustand';
import { projectService, type ProjectDTO } from '@/services/projectService';

interface CanvasState {
  currentProject: ProjectDTO | null;
  isLoading: boolean;
  error: string | null;

  createProject: (name: string, description?: string) => Promise<ProjectDTO | null>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (name: string, description?: string, canvasData?: unknown) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  listProjects: () => Promise<ProjectDTO[]>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  currentProject: null,
  isLoading: false,
  error: null,

  createProject: async (name, description = '') => {
    try {
      set({ isLoading: true, error: null });
      const project = await projectService.create({
        name,
        description,
        canvasData: { nodes: [], edges: [] },
        isDraft: false,
      });
      set({
        currentProject: project,
        isLoading: false,
      });
      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建项目失败';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  loadProject: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const project = await projectService.get(projectId);
      set({
        currentProject: project,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载项目失败';
      set({ error: message, isLoading: false });
    }
  },

  saveProject: async (name, description = '', canvasData) => {
    const { currentProject } = get();
    try {
      set({ isLoading: true, error: null });

      if (currentProject?.id) {
        const updated = await projectService.update(currentProject.id, {
          name,
          description,
          canvasData,
          isDraft: false,
        });
        set({
          currentProject: { ...currentProject, ...updated },
          isLoading: false,
        });
      } else {
        const project = await projectService.create({
          name,
          description,
          canvasData: canvasData || { nodes: [], edges: [] },
          isDraft: false,
        });
        set({
          currentProject: project,
          isLoading: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存项目失败';
      set({ error: message, isLoading: false });
    }
  },

  deleteProject: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      await projectService.delete(projectId);

      const { currentProject } = get();
      if (currentProject?.id === projectId) {
        set({
          currentProject: null,
          error: null,
        });
      }
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除项目失败';
      set({ error: message, isLoading: false });
    }
  },

  listProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await projectService.list();
      set({ isLoading: false });
      return projects;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取项目列表失败';
      set({ error: message, isLoading: false });
      return [];
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set({
      currentProject: null,
      isLoading: false,
      error: null,
    });
  },
}));