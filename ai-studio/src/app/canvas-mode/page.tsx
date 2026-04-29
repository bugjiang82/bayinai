"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel,
  Node,
  Edge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./canvas.css";

import ImageNode from "@/components/canvas-mode/ImageNode";
import PromptNode from "@/components/canvas-mode/PromptNode";
import Toolbar from "@/components/canvas-mode/Toolbar";
import { NodeTypeModal } from "@/components/canvas-mode/NodeTypeModal";
import { CanvasList } from "@/components/canvas-mode/CanvasList";

const nodeTypes = {
  imageNode: ImageNode,
  promptNode: PromptNode,
};

export default function CanvasModePage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type,
        position,
        data: {},
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((prev) => prev + 1);
    },
    [nodeIdCounter, setNodes]
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      handleAddNode("imageNode", position);
    },
    [screenToFlowPosition, handleAddNode]
  );

  const handleNewProject = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeIdCounter(1);
  }, [setNodes, setEdges]);

  const handleSaveProject = useCallback(() => {
    const data = { nodes, edges, version: 1 };
    localStorage.setItem("canvas-project", JSON.stringify(data));
    alert("项目已保存!");
  }, [nodes, edges]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full canvas-mode">
      <div className="cyber-grid" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={20} size={1} />
        <Controls className="glass !bg-[#14141f]/80 !border-cyber-cyan/30" />
        <MiniMap 
          className="glass !bg-[#14141f]/80 !border-cyber-cyan/30"
          nodeStrokeColor={(node) => 
            (node.type === "imageNode" ? "#00f5ff" : "#ff00ff")
          }
          nodeColor={(node) => 
            (node.type === "imageNode" ? "rgba(0, 245, 255, 0.2)" : "rgba(255, 0, 255, 0.2)")
          }
        />
        
        <Panel position="top-left">
          <Toolbar 
            onNew={handleNewProject}
            onSave={handleSaveProject}
            onShowList={() => setShowCanvasList(true)}
            onAddNode={() => setShowNodeModal(true)}
          />
        </Panel>
      </ReactFlow>

      <NodeTypeModal 
        isOpen={showNodeModal} 
        onClose={() => setShowNodeModal(false)}
        onSelect={(type) => {
          handleAddNode(type, { x: 100, y: 100 });
          setShowNodeModal(false);
        }}
      />

      <CanvasList 
        isOpen={showCanvasList}
        onClose={() => setShowCanvasList(false)}
      />
    </div>
  );
}
