'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './canvas.css'

import ImageNode from '@/components/canvas-mode/ImageNode'
import PromptNode from '@/components/canvas-mode/PromptNode'
import Toolbar from '@/components/canvas-mode/Toolbar'
import { NodeTypeModal } from '@/components/canvas-mode/NodeTypeModal'
import { CanvasList } from '@/components/canvas-mode/CanvasList'

const nodeTypes = {
  imageNode: ImageNode,
  promptNode: PromptNode
}

let idCounter = 1
const getId = () => `node_${idCounter++}`

export default function CanvasModePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { screenToFlowPosition } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const connectingNodeId = useRef<string | null>(null)
  const connectingPosition = useRef<{ x: number; y: number } | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showNodeTypeModal, setShowNodeTypeModal] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [canvasId, setCanvasId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState('')
  const [showCanvasList, setShowCanvasList] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const canvasIdFromUrl = urlParams.get('canvas')

    if (canvasIdFromUrl) {
      loadCanvasFromServer(canvasIdFromUrl)
    } else {
      setNodes([
        {
          id: 'node_1',
          type: 'imageNode',
          position: { x: 100, y: 100 },
          data: { image: null, prompt: '' }
        }
      ])
      idCounter = 2
    }
  }, [])

  const saveCanvasToServer = async () => {
    try {
      setSaveStatus('保存中...')
      const response = await fetch('/api/canvas/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCanvasId(data.id)
        window.history.replaceState({}, '', `/canvas-mode?canvas=${data.id}`)
        setSaveStatus('已保存')
        setTimeout(() => setSaveStatus(''), 2000)
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('保存失败')
    }
  }

  const loadCanvasFromServer = async (id: string) => {
    try {
      const response = await fetch(`/api/canvas/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
        setCanvasId(id)

        const maxId = data.nodes?.reduce((max: number, node: { id: string }) => {
          const num = parseInt(node.id.replace('node_', ''))
          return Math.max(max, num)
        }, 0) || 0
        idCounter = maxId + 1

        setSaveStatus('已加载')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setNodes([
          {
            id: 'node_1',
            type: 'imageNode',
            position: { x: 100, y: 100 },
            data: { image: null, prompt: '' }
          }
        ])
        idCounter = 2
      }
    } catch (error) {
      console.error('Load failed:', error)
    }
  }

  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onConnectStart = useCallback((_: unknown, { nodeId }: { nodeId: string | null }) => {
    connectingNodeId.current = nodeId
    setShowHint(true)
  }, [])

  const onConnectEnd = useCallback(
    (event: MouseEvent) => {
      setShowHint(false)
      if (!connectingNodeId.current) return

      const targetIsPane = (event.target as HTMLElement)?.classList?.contains('react-flow__pane')

      if (targetIsPane && reactFlowWrapper.current) {
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect()
        const flowPos = screenToFlowPosition({
          x: event.clientX - left,
          y: event.clientY - top
        })
        connectingPosition.current = flowPos
        setMenuPosition({ x: event.clientX, y: event.clientY })
        setShowNodeTypeModal(true)
      }
    },
    [screenToFlowPosition]
  )

  const handleNodeTypeSelect = useCallback((type: string) => {
    setShowNodeTypeModal(false)
    if (!connectingNodeId.current || !connectingPosition.current) return

    const parentNode = nodes.find(n => n.id === connectingNodeId.current)
    const parentImage = parentNode?.data?.image
    const newNodeId = getId()

    let newNode

    if (type === 'extract') {
      newNode = {
        id: newNodeId,
        type: 'promptNode',
        position: connectingPosition.current,
        data: {
          inheritImage: parentImage,
          extractedPrompt: '',
          editedPrompt: ''
        }
      }
    } else {
      newNode = {
        id: newNodeId,
        type: 'imageNode',
        position: connectingPosition.current,
        data: {
          image: null,
          prompt: '',
          inheritImage: parentImage
        }
      }
    }

    const newEdge = {
      id: `e${connectingNodeId.current}-${newNodeId}`,
      source: connectingNodeId.current,
      target: newNodeId,
      animated: true
    }

    setNodes((nds) => nds.concat(newNode))
    setEdges((eds) => eds.concat(newEdge))

    connectingNodeId.current = null
    connectingPosition.current = null
  }, [nodes, setNodes, setEdges])

  const addNode = useCallback(() => {
    const newNode = {
      id: getId(),
      type: 'imageNode',
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200
      },
      data: { image: null, prompt: '' }
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const clearCanvas = useCallback(() => {
    setNodes([])
    setEdges([])
    idCounter = 1
  }, [setNodes, setEdges])

  const newCanvas = useCallback(() => {
    setCanvasId(null)
    setNodes([])
    setEdges([])
    idCounter = 1
    window.history.replaceState({}, '', '/canvas-mode')
    setSaveStatus('已新建')
    setTimeout(() => setSaveStatus(''), 2000)
  }, [setNodes, setEdges])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full canvas-mode">
      <div className="cyber-grid" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Background color="rgba(0, 245, 255, 0.1)" gap={50} size={1} />
        <Controls className="glass" />
        <MiniMap
          className="glass"
          nodeColor={(node) => {
            if (node.type === 'promptNode') return '#f59e0b'
            return node.data?.image ? '#00f5ff' : '#ff00ff'
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
        />

        <Panel position="top-center">
          <Toolbar
            onAddNode={addNode}
            onClear={clearCanvas}
            onSave={saveCanvasToServer}
            onNew={newCanvas}
            saveStatus={saveStatus}
            onOpenProjects={() => setShowCanvasList(true)}
          />
        </Panel>

        {showHint && (
          <Panel position="center">
            <div className="glass px-6 py-3 rounded-lg text-cyber-magenta font-medium">
              拖拽到空白处创建新节点
            </div>
          </Panel>
        )}

        <Panel position="bottom-left">
          <div className="glass p-4 rounded-xl max-w-xs">
            <h4 className="text-cyber-cyan font-semibold mb-2 text-sm">💡 操作指南</h4>
            <div className="text-xs text-gray-300 space-y-1">
              <p>• 点击 <span className="text-cyber-cyan">+ 添加节点</span> 创建新节点</p>
              <p>• 从节点右侧的 <span className="text-cyber-cyan">●</span> 拖拽到空白处</p>
              <p>• 选择<span className="text-cyber-cyan">提取提示词</span>分析并编辑父节点图像</p>
              <p>• 选择<span className="text-cyber-magenta">图生图编辑</span>基于父节点生成新图</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
      <NodeTypeModal
        isOpen={showNodeTypeModal}
        position={menuPosition}
        onClose={() => {
          setShowNodeTypeModal(false)
          connectingNodeId.current = null
          connectingPosition.current = null
        }}
        onSelect={handleNodeTypeSelect}
      />

      <CanvasList
        isOpen={showCanvasList}
        onClose={() => setShowCanvasList(false)}
        onOpenCanvas={loadCanvasFromServer}
      />
    </div>
  )
}
