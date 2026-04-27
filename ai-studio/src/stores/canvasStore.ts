import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    content: string | null;
    prompt: string;
    params: Record<string, any>;
    status: 'idle' | 'generating' | 'completed' | 'failed';
  };
  generationId?: string;
}

interface CanvasConnection {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface CanvasProject {
  id: string;
  name: string;
  description: string;
  canvasData: {
    nodes: CanvasNode[];
    connections: CanvasConnection[];
  };
  thumbnail: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CanvasState {
  // 当前项目
  currentProject: CanvasProject | null;
  // 节点和连接
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  // 选中的节点
  selectedNode: CanvasNode | null;
  // 画布状态
  isLoading: boolean;
  error: string | null;
  // 操作方法
  createNewProject: () => void;
  saveProject: (name: string, description?: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjects: () => Promise<CanvasProject[]>;
  // 节点操作
  addNode: (type: string, position: { x: number; y: number }) => string;
  updateNode: (nodeId: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  // 连接操作
  addConnection: (source: string, target: string, type: string) => string;
  deleteConnection: (connectionId: string) => void;
  // 生成操作
  generateFromNode: (nodeId: string, referenceNodeId?: string) => Promise<void>;
  // 画布操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // 重置状态
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentProject: null,
      nodes: [],
      connections: [],
      selectedNode: null,
      isLoading: false,
      error: null,

      // 创建新项目
      createNewProject: () => {
        const newProject: CanvasProject = {
          id: `project-${Date.now()}`,
          name: '新建项目',
          description: '',
          canvasData: {
            nodes: [],
            connections: [],
          },
          thumbnail: null,
          isDraft: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          currentProject: newProject,
          nodes: [],
          connections: [],
          selectedNode: null,
          error: null,
        });
      },

      // 保存项目
      saveProject: async (name, description = '') => {
        const { currentProject, nodes, connections } = get();
        try {
          set({ isLoading: true, error: null });

          // 构建项目数据
          const projectData = {
            ...currentProject,
            name,
            description,
            canvasData: {
              nodes,
              connections,
            },
            isDraft: false,
            updatedAt: new Date().toISOString(),
          };

          // 调用 API 保存项目
          // 这里需要实现 API 调用
          console.log('保存项目:', projectData);

          set({
            currentProject: projectData as CanvasProject,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: '保存项目失败',
            isLoading: false,
          });
        }
      },

      // 加载项目
      loadProject: async (projectId) => {
        try {
          set({ isLoading: true, error: null });

          // 调用 API 加载项目
          // 这里需要实现 API 调用
          console.log('加载项目:', projectId);

          // 模拟项目数据
          const mockProject: CanvasProject = {
            id: projectId,
            name: '测试项目',
            description: '测试项目描述',
            canvasData: {
              nodes: [],
              connections: [],
            },
            thumbnail: null,
            isDraft: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            currentProject: mockProject,
            nodes: mockProject.canvasData.nodes,
            connections: mockProject.canvasData.connections,
            selectedNode: null,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: '加载项目失败',
            isLoading: false,
          });
        }
      },

      // 删除项目
      deleteProject: async (projectId) => {
        try {
          set({ isLoading: true, error: null });

          // 调用 API 删除项目
          // 这里需要实现 API 调用
          console.log('删除项目:', projectId);

          // 如果删除的是当前项目，创建一个新项目
          const { currentProject } = get();
          if (currentProject?.id === projectId) {
            get().createNewProject();
          }

          set({ isLoading: false });
        } catch (error) {
          set({
            error: '删除项目失败',
            isLoading: false,
          });
        }
      },

      // 获取项目列表
      getProjects: async () => {
        try {
          set({ isLoading: true, error: null });

          // 调用 API 获取项目列表
          // 这里需要实现 API 调用
          console.log('获取项目列表');

          // 模拟项目列表
          const mockProjects: CanvasProject[] = [
            {
              id: 'project-1',
              name: '测试项目 1',
              description: '测试项目 1 描述',
              canvasData: {
                nodes: [],
                connections: [],
              },
              thumbnail: null,
              isDraft: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];

          set({ isLoading: false });
          return mockProjects;
        } catch (error) {
          set({
            error: '获取项目列表失败',
            isLoading: false,
          });
          return [];
        }
      },

      // 添加节点
      addNode: (type, position) => {
        const newNode: CanvasNode = {
          id: `node-${Date.now()}`,
          type,
          position,
          data: {
            label: `新${type}节点`,
            content: null,
            prompt: '',
            params: {},
            status: 'idle',
          },
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
          selectedNode: newNode,
        }));

        return newNode.id;
      },

      // 更新节点
      updateNode: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
          selectedNode: state.selectedNode?.id === nodeId
            ? { ...state.selectedNode, ...updates }
            : state.selectedNode,
        }));
      },

      // 删除节点
      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          connections: state.connections.filter(
            (conn) => conn.source !== nodeId && conn.target !== nodeId
          ),
          selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
        }));
      },

      // 选择节点
      selectNode: (nodeId) => {
        const { nodes } = get();
        const node = nodeId ? nodes.find((n) => n.id === nodeId) : null;
        set({ selectedNode: node });
      },

      // 添加连接
      addConnection: (source, target, type) => {
        const newConnection: CanvasConnection = {
          id: `conn-${Date.now()}`,
          source,
          target,
          type,
        };

        set((state) => ({
          connections: [...state.connections, newConnection],
        }));

        return newConnection.id;
      },

      // 删除连接
      deleteConnection: (connectionId) => {
        set((state) => ({
          connections: state.connections.filter(
            (conn) => conn.id !== connectionId
          ),
        }));
      },

      // 从节点生成
      generateFromNode: async (nodeId, referenceNodeId) => {
        const { nodes } = get();
        const node = nodes.find((n) => n.id === nodeId);
        const referenceNode = referenceNodeId
          ? nodes.find((n) => n.id === referenceNodeId)
          : null;

        if (!node) return;

        try {
          set({ isLoading: true, error: null });

          // 更新节点状态为生成中
          get().updateNode(nodeId, {
            data: {
              ...node.data,
              status: 'generating',
            },
          });

          // 调用生成 API
          // 这里需要实现 API 调用
          console.log('从节点生成:', {
            nodeId,
            referenceNodeId,
            prompt: node.data.prompt,
            params: node.data.params,
          });

          // 模拟生成完成
          setTimeout(() => {
            get().updateNode(nodeId, {
              data: {
                ...node.data,
                status: 'completed',
                content: 'https://example.com/generated-image.jpg',
              },
            });
            set({ isLoading: false });
          }, 2000);
        } catch (error) {
          get().updateNode(nodeId, {
            data: {
              ...node.data,
              status: 'failed',
            },
          });
          set({
            error: '生成失败',
            isLoading: false,
          });
        }
      },

      // 设置加载状态
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // 设置错误
      setError: (error) => {
        set({ error });
      },

      // 重置状态
      reset: () => {
        set({
          currentProject: null,
          nodes: [],
          connections: [],
          selectedNode: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'canvas-storage',
      partialize: (state) => ({
        currentProject: state.currentProject,
        nodes: state.nodes,
        connections: state.connections,
      }),
    }
  )
);
