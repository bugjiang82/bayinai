'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ProjectDTO } from '@/services/projectService';

export interface ProjectManagerState {
  currentProjectId: string | null;
  currentProjectName: string;
  projectDescription: string;
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export function useProjectManager(initialProjectId: string | null) {
  const [state, setState] = useState<ProjectManagerState>({
    currentProjectId: initialProjectId,
    currentProjectName: '未命名项目',
    projectDescription: '',
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasDataRef = useRef<{ nodes: unknown[]; edges: unknown[] }>({ nodes: [], edges: [] });
  const canvasStore = useCanvasStore;

  const setCurrentProjectId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, currentProjectId: id }));
  }, []);

  const setCurrentProjectName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, currentProjectName: name }));
  }, []);

  const setHasUnsavedChanges = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, hasUnsavedChanges: value }));
  }, []);

  const updateCanvasData = useCallback((nodes: unknown[], edges: unknown[]) => {
    canvasDataRef.current = { nodes, edges };
  }, []);

  const handleSaveProject = useCallback(async (name: string, description: string) => {
    setState((prev) => ({ ...prev, isSaving: true }));
    try {
      const projectService = await import('@/services/projectService');
      const result = state.currentProjectId
        ? await projectService.projectService.update(state.currentProjectId, {
            name,
            description,
            canvasData: canvasDataRef.current,
            isDraft: false,
          })
        : await projectService.projectService.create({
            name,
            description,
            canvasData: canvasDataRef.current,
            isDraft: false,
          });

      const projectId = 'id' in result ? result.id : result;
      setState((prev) => ({
        ...prev,
        currentProjectId: typeof projectId === 'string' ? projectId : prev.currentProjectId,
        currentProjectName: name,
        projectDescription: description,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
      }));
      return projectId;
    } catch {
      setState((prev) => ({ ...prev, isSaving: false }));
      throw new Error('保存项目失败');
    }
  }, [state.currentProjectId]);

  const handleLoadProject = useCallback(async (projectId: string): Promise<ProjectDTO | null> => {
    try {
      const projectService = await import('@/services/projectService');
      const project = await projectService.projectService.get(projectId);
      setState((prev) => ({
        ...prev,
        currentProjectId: project.id,
        currentProjectName: project.name,
        projectDescription: project.description || '',
        lastSaved: null,
      }));
      canvasDataRef.current = project.canvasData;
      return project;
    } catch {
      return null;
    }
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string | null = null) => {
    const idToDelete = projectId || state.currentProjectId;
    if (!idToDelete) return;
    try {
      const projectService = await import('@/services/projectService');
      await projectService.projectService.delete(idToDelete);
      if (idToDelete === state.currentProjectId) {
        setState((prev) => ({
          ...prev,
          currentProjectId: null,
          currentProjectName: '未命名项目',
          projectDescription: '',
          lastSaved: null,
          hasUnsavedChanges: false,
        }));
      }
    } catch {
      throw new Error('删除项目失败');
    }
  }, [state.currentProjectId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    setCurrentProjectId,
    setCurrentProjectName,
    setHasUnsavedChanges,
    updateCanvasData,
    handleSaveProject,
    handleLoadProject,
    handleDeleteProject,
    canvasDataRef,
  };
}