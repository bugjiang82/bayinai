'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Node {
  id: string;
  type: 'image' | 'prompt' | 'generate';
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  prompt?: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  selected: boolean;
  hovered: boolean;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromHandle: 'left' | 'right';
  toHandle: 'left' | 'right';
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

interface ToolbarButton {
  id: string;
  icon: string;
  label: string;
  active?: boolean;
}

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [draggingFromHandle, setDraggingFromHandle] = useState<{ nodeId: string; handle: 'left' | 'right' } | null>(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [nodeMenuPosition, setNodeMenuPosition] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(true);
  const [promptInput, setPromptInput] = useState('');
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const toolbarButtons: ToolbarButton[] = [
    { id: 'select', icon: '☝️', label: '选择' },
    { id: 'pan', icon: '✋', label: '平移' },
    { id: 'zoom-in', icon: '🔍+', label: '放大' },
    { id: 'zoom-out', icon: '🔍-', label: '缩小' },
    { id: 'add-image', icon: '🖼️', label: '图片节点' },
    { id: 'add-prompt', icon: '📝', label: '提示词节点' },
    { id: 'save', icon: '💾', label: '保存' },
    { id: 'share', icon: '🔗', label: '分享' },
  ];

  const nodeMenuItems: MenuItem[] = [
    { id: 'redraw', label: '重绘', icon: '🔄' },
    { id: 'enhance', label: 'HD增强', icon: '⬆️' },
    { id: 'download', label: '下载', icon: '📥' },
    { id: 'fullscreen', label: '全屏', icon: '🔲' },
  ];

  const generateMenuItems: MenuItem[] = [
    { id: 'text', label: '文本生成', icon: '📝' },
    { id: 'image', label: '图片生成', icon: '🖼️' },
    { id: 'video', label: '视频生成', icon: '🎬' },
    { id: 'edit', label: '图片编辑', icon: '✏️' },
  ];

  const models = ['Flash', 'Pro', 'Image2'];
  const qualities = ['Standard', 'HD', 'Ultra HD'];
  const ratios = ['1:1', '16:9', '9:16', '4:3'];

  useEffect(() => {
    const initialNodes: Node[] = [
      {
        id: 'node-1',
        type: 'image',
        x: 100,
        y: 150,
        width: 200,
        height: 180,
        imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=beautiful%20parrot%20on%20branch%20realistic&image_size=square',
        status: 'completed',
        selected: false,
        hovered: false,
      },
      {
        id: 'node-2',
        type: 'prompt',
        x: 400,
        y: 150,
        width: 200,
        height: 120,
        prompt: '一只美丽的小太阳鹦鹉',
        status: 'completed',
        selected: false,
        hovered: false,
      },
      {
        id: 'node-3',
        type: 'generate',
        x: 700,
        y: 150,
        width: 200,
        height: 180,
        imageUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20sun%20conure%20parrot%20colorful&image_size=square',
        status: 'completed',
        selected: false,
        hovered: false,
      },
    ];
    setNodes(initialNodes);

    const initialConnections: Connection[] = [
      { id: 'conn-1', from: 'node-1', to: 'node-3', fromHandle: 'right', toHandle: 'left' },
      { id: 'conn-2', from: 'node-2', to: 'node-3', fromHandle: 'right', toHandle: 'left' },
    ];
    setConnections(initialConnections);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(viewOffset.x, viewOffset.y);
      ctx.scale(scale, scale);

      drawGrid(ctx, canvas.width, canvas.height);
      connections.forEach(conn => drawConnection(ctx, conn));
      nodes.forEach(node => drawNode(ctx, node));

      if (draggingFromHandle) {
        const fromNode = nodes.find(n => n.id === draggingFromHandle.nodeId);
        if (fromNode) {
          const handleX = draggingFromHandle.handle === 'right' ? fromNode.x + fromNode.width : fromNode.x;
          const handleY = fromNode.y + fromNode.height / 2;
          drawConnectionLine(ctx, handleX, handleY, mousePos.x - viewOffset.x, mousePos.y - viewOffset.y);
        }
      }

      ctx.restore();

      if (showToolbar) {
        drawToolbar(ctx, canvas.width);
      }

      if (showNodeMenu) {
        drawNodeMenu(ctx, nodeMenuPosition.x, nodeMenuPosition.y);
      }

      if (showPromptDialog && selectedNodeId) {
        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
          drawPromptDialog(ctx, dialogPosition.x, dialogPosition.y);
        }
      }

      requestAnimationFrame(render);
    };

    render();
  }, [nodes, connections, selectedNodeId, hoveredNodeId, draggingFromHandle, showNodeMenu, nodeMenuPosition, showToolbar, showPromptDialog, dialogPosition, viewOffset, scale, mousePos]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    
    for (let x = 0; x < width / scale + 100; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height / scale + 100);
      ctx.stroke();
    }
    
    for (let y = 0; y < height / scale + 100; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width / scale + 100, y);
      ctx.stroke();
    }
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node) => {
    ctx.save();

    if (node.selected) {
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 15;
    }

    const gradient = ctx.createLinearGradient(node.x, node.y, node.x, node.y + node.height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#121212');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = node.selected ? '#6366f1' : '#333';
    ctx.lineWidth = node.selected ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#666';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(getNodeTypeLabel(node.type), node.x + 12, node.y + 22);

    if (node.type === 'image' || node.type === 'generate') {
      if (node.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = node.imageUrl;
        img.onload = () => {
          ctx.drawImage(img, node.x + 12, node.y + 36, node.width - 24, node.height - 60);
        };
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(node.x + 12, node.y + 36, node.width - 24, node.height - 60);
      } else {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(node.x + 12, node.y + 36, node.width - 24, node.height - 60);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+ 点击上传', node.x + node.width / 2, node.y + node.height / 2 + 5);
      }
    } else if (node.type === 'prompt') {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(node.x + 12, node.y + 36, node.width - 24, node.height - 50);
      
      ctx.fillStyle = '#888';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const promptText = node.prompt || '输入提示词...';
      ctx.fillText(promptText.substring(0, 30), node.x + 20, node.y + 44);
    }

    if (node.hovered) {
      const handleColor = '#6366f1';
      const handleSize = 14;

      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(node.x - 7, node.y + node.height / 2, handleSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = handleColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', node.x - 7, node.y + node.height / 2);

      ctx.fillStyle = handleColor;
      ctx.beginPath();
      ctx.arc(node.x + node.width + 7, node.y + node.height / 2, handleSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('+', node.x + node.width + 7, node.y + node.height / 2);
    }

    if (node.status === 'generating') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(node.x, node.y, node.width, node.height);
      
      ctx.fillStyle = '#6366f1';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('生成中...', node.x + node.width / 2, node.y + node.height / 2);
    }

    ctx.restore();
  };

  const getNodeTypeLabel = (type: Node['type']) => {
    switch (type) {
      case 'image': return '图片';
      case 'prompt': return '提示词';
      case 'generate': return '生成';
      default: return '节点';
    }
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, conn: Connection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return;

    const fromX = conn.fromHandle === 'right' ? fromNode.x + fromNode.width : fromNode.x;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = conn.toHandle === 'right' ? toNode.x + toNode.width : toNode.x;
    const toY = toNode.y + toNode.height / 2;

    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 5;

    const midX = (fromX + toX) / 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(midX, fromY, midX, (fromY + toY) / 2);
    ctx.quadraticCurveTo(midX, toY, toX, toY);
    ctx.stroke();

    const arrowSize = 8;
    const angle = Math.atan2(toY - (fromY + toY) / 2, toX - midX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6));
    ctx.stroke();

    ctx.restore();
  };

  const drawConnectionLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const midX = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, y1, midX, (y1 + y2) / 2);
    ctx.quadraticCurveTo(midX, y2, x2, y2);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(x2, y2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x2, y2);
    ctx.restore();
  };

  const drawToolbar = (ctx: CanvasRenderingContext2D, canvasWidth: number) => {
    const toolbarHeight = 56;
    const toolbarY = 16;

    ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, toolbarY, canvasWidth - 32, toolbarHeight, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('🎨 Canvas Studio', 28, toolbarY + 36);

    const startX = 200;
    const buttonWidth = 48;
    const buttonGap = 8;

    toolbarButtons.forEach((btn, index) => {
      const btnX = startX + index * (buttonWidth + buttonGap);
      
      if (btn.active) {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.roundRect(btnX, toolbarY + 8, buttonWidth, buttonWidth, 8);
        ctx.fill();
      }

      ctx.fillStyle = btn.active ? '#fff' : '#888';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(btn.icon, btnX + buttonWidth / 2, toolbarY + 32);
    });

    ctx.fillStyle = '#666';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(scale * 100)}%`, canvasWidth - 28, toolbarY + 36);
  };

  const drawNodeMenu = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const menuWidth = 200;
    const menuHeight = nodeMenuItems.length * 44;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, menuWidth, menuHeight, 12);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    nodeMenuItems.forEach((item, index) => {
      const itemY = y + index * 44;
      
      ctx.fillStyle = '#666';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.icon + '  ' + item.label, x + 16, itemY + 28);

      if (index < nodeMenuItems.length - 1) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, itemY + 44);
        ctx.lineTo(x + menuWidth - 12, itemY + 44);
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  const drawPromptDialog = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const dialogWidth = 800;
    const dialogHeight = 200;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, dialogWidth, dialogHeight, 16);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#333';
    ctx.fillRect(x + 16, y + 16, dialogWidth - 32, 80);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 16, y + 16, dialogWidth - 32, 80);

    ctx.fillStyle = '#888';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(promptInput || '输入提示词...', x + 24, y + 60);

    const dropdownX = x + 16;
    const dropdownY = y + 112;
    const dropdownWidth = 140;
    const dropdownHeight = 36;
    const dropdownGap = 12;

    const dropdowns = [
      { label: '模型', options: models, value: 'Flash' },
      { label: '质量', options: qualities, value: 'HD' },
      { label: '比例', options: ratios, value: '1:1' },
    ];

    dropdowns.forEach((dd, index) => {
      const ddX = dropdownX + index * (dropdownWidth + dropdownGap);
      
      ctx.fillStyle = '#2a2a2a';
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ddX, dropdownY, dropdownWidth, dropdownHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#888';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(dd.value, ddX + 12, dropdownY + 24);

      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(ddX + dropdownWidth - 20, dropdownY + 12);
      ctx.lineTo(ddX + dropdownWidth - 12, dropdownY + 20);
      ctx.lineTo(ddX + dropdownWidth - 20, dropdownY + 28);
      ctx.fill();
    });

    const pointsX = x + dialogWidth - 180;
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.roundRect(pointsX, dropdownY, 80, dropdownHeight, 8);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💰 5 积分', pointsX + 40, dropdownY + 24);

    const sendBtnX = x + dialogWidth - 80;
    const gradient = ctx.createLinearGradient(sendBtnX, dropdownY, sendBtnX, dropdownY + dropdownHeight);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#4f46e5');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(sendBtnX, dropdownY, 70, dropdownHeight, 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('发送', sendBtnX + 35, dropdownY + 24);

    ctx.restore();
  };

  const getNodeAtPosition = useCallback((x: number, y: number) => {
    const scaledX = (x - viewOffset.x) / scale;
    const scaledY = (y - viewOffset.y) / scale;
    
    return nodes.find(node => 
      scaledX >= node.x && scaledX <= node.x + node.width &&
      scaledY >= node.y && scaledY <= node.y + node.height
    );
  }, [nodes, viewOffset, scale]);

  const getHandleAtPosition = useCallback((x: number, y: number) => {
    const scaledX = (x - viewOffset.x) / scale;
    const scaledY = (y - viewOffset.y) / scale;
    
    for (const node of nodes) {
      const leftHandleX = node.x - 7;
      const rightHandleX = node.x + node.width + 7;
      const handleY = node.y + node.height / 2;
      
      const leftDist = Math.sqrt((scaledX - leftHandleX) ** 2 + (scaledY - handleY) ** 2);
      const rightDist = Math.sqrt((scaledX - rightHandleX) ** 2 + (scaledY - handleY) ** 2);
      
      if (leftDist <= 14) return { nodeId: node.id, handle: 'left' as const };
      if (rightDist <= 14) return { nodeId: node.id, handle: 'right' as const };
    }
    return null;
  }, [nodes, viewOffset, scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const handle = getHandleAtPosition(x, y);
    if (handle && handle.handle === 'right') {
      setDraggingFromHandle(handle);
      return;
    }

    const node = getNodeAtPosition(x, y);
    
    if (node) {
      setDraggedNode(node.id);
      setSelectedNodeId(node.id);
      setShowNodeMenu(true);
      setNodeMenuPosition({ x, y: y - 100 });
      setShowPromptDialog(true);
      setDialogPosition({ x: Math.max(16, x - 400), y: y + node.height + 16 });
    } else {
      setSelectedNodeId(null);
      setShowNodeMenu(false);
      setShowPromptDialog(false);
      
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
      }
    }
  }, [getNodeAtPosition, getHandleAtPosition, viewOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isPanning) {
      setViewOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggedNode) {
      setNodes(prev => prev.map(node =>
        node.id === draggedNode
          ? { ...node, x: (x - viewOffset.x) / scale - node.width / 2, y: (y - viewOffset.y) / scale - node.height / 2 }
          : node
      ));
      if (showPromptDialog) {
        const selectedNode = nodes.find(n => n.id === draggedNode);
        if (selectedNode) {
          setDialogPosition({ 
            x: Math.max(16, x - 400), 
            y: (y - viewOffset.y) / scale + selectedNode.height + 16 
          });
        }
      }
      return;
    }

    if (draggingFromHandle) {
      return;
    }

    const node = getNodeAtPosition(x, y);
    setHoveredNodeId(node?.id || null);
    setNodes(prev => prev.map(n => ({ ...n, hovered: n.id === node?.id })));
  }, [draggedNode, draggingFromHandle, isPanning, panStart, getNodeAtPosition, viewOffset, scale, showPromptDialog, nodes]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingFromHandle) {
      const handle = getHandleAtPosition(x, y);
      if (handle && handle.handle === 'left' && handle.nodeId !== draggingFromHandle.nodeId) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: draggingFromHandle.nodeId,
          to: handle.nodeId,
          fromHandle: draggingFromHandle.handle,
          toHandle: handle.handle,
        };
        setConnections(prev => [...prev, newConnection]);
      }
      setDraggingFromHandle(null);
      return;
    }

    setDraggedNode(null);
    setIsPanning(false);

    const handle = getHandleAtPosition(x, y);
    if (handle && handle.handle === 'right') {
      setShowNodeMenu(true);
      setNodeMenuPosition({ x: x + 20, y });
    }
  }, [draggingFromHandle, getHandleAtPosition]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.25, Math.min(2, prev * delta)));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedNodeId) {
      setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
      setConnections(prev => prev.filter(c => c.from !== selectedNodeId && c.to !== selectedNodeId));
      setSelectedNodeId(null);
      setShowNodeMenu(false);
      setShowPromptDialog(false);
    }
    
    if (e.key === 'Escape') {
      setSelectedNodeId(null);
      setShowNodeMenu(false);
      setShowPromptDialog(false);
    }
    
    if (showPromptDialog && e.key === 'Enter' && e.ctrlKey) {
      alert(`发送提示词: ${promptInput}`);
    }
  }, [selectedNodeId, showPromptDialog, promptInput]);

  const handleToolbarClick = useCallback((x: number) => {
    const startX = 200;
    const buttonWidth = 48;
    const buttonGap = 8;

    toolbarButtons.forEach((btn, index) => {
      const btnX = startX + index * (buttonWidth + buttonGap);
      if (x >= btnX && x <= btnX + buttonWidth) {
        switch (btn.id) {
          case 'zoom-in':
            setScale(prev => Math.min(2, prev * 1.2));
            break;
          case 'zoom-out':
            setScale(prev => Math.max(0.25, prev / 1.2));
            break;
          case 'add-image':
            const newImageNode: Node = {
              id: `node-${Date.now()}`,
              type: 'image',
              x: 200,
              y: 200,
              width: 200,
              height: 180,
              status: 'idle',
              selected: false,
              hovered: false,
            };
            setNodes(prev => [...prev, newImageNode]);
            break;
          case 'add-prompt':
            const newPromptNode: Node = {
              id: `node-${Date.now()}`,
              type: 'prompt',
              x: 200,
              y: 200,
              width: 200,
              height: 120,
              status: 'idle',
              selected: false,
              hovered: false,
            };
            setNodes(prev => [...prev, newPromptNode]);
            break;
          case 'save':
            alert('项目已保存');
            break;
          case 'share':
            alert('分享链接已复制');
            break;
        }
      }
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    
    if (x >= 16 && x <= canvasRef.current.width - 16 && e.clientY >= 16 && e.clientY <= 72) {
      handleToolbarClick(x);
    }
  }, [handleToolbarClick]);

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="cursor-crosshair"
      />
      <style>{`
        canvas:focus { outline: none; }
      `}</style>
    </div>
  );
}
