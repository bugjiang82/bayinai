"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Lasso, 
  Paintbrush, 
  Eraser, 
  Undo2, 
  X, 
  Maximize2, 
  Minimize2,
  Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type ToolType = "lasso" | "brush" | "eraser";

interface SelectionToolProps {
  image: string;
  onSelectionChange?: (mask: string | null) => void;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface HistoryItem {
  canvas: HTMLCanvasElement;
}

export default function SelectionTool({ 
  image, 
  onSelectionChange,
  className 
}: SelectionToolProps) {
  const [tool, setTool] = useState<ToolType>("lasso");
  const [brushSize, setBrushSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  const getImageCoords = useCallback((clientX: number, clientY: number): Point => {
    if (!containerRef.current || !imageRef.current) {
      return { x: 0, y: 0 };
    }

    const container = containerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    
    const scaleX = imageRef.current.naturalWidth / image.width;
    const scaleY = imageRef.current.naturalHeight / image.height;

    const x = (clientX - image.left) * scaleX / zoom;
    const y = (clientY - image.top) * scaleY / zoom;

    return { 
      x: Math.max(0, Math.min(x, imageRef.current.naturalWidth)),
      y: Math.max(0, Math.min(y, imageRef.current.naturalHeight))
    };
  }, [zoom]);

  const initCanvas = useCallback(() => {
    if (!imageRef.current || !maskCanvasRef.current || !tempCanvasRef.current || !displayCanvasRef.current) {
      return;
    }

    const { naturalWidth, naturalHeight } = imageRef.current;
    
    maskCanvasRef.current.width = naturalWidth;
    maskCanvasRef.current.height = naturalHeight;
    tempCanvasRef.current.width = naturalWidth;
    tempCanvasRef.current.height = naturalHeight;
    displayCanvasRef.current.width = naturalWidth;
    displayCanvasRef.current.height = naturalHeight;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, naturalWidth, naturalHeight);
    }

    renderDisplay();
  }, []);

  const saveHistory = useCallback(() => {
    if (!maskCanvasRef.current) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = maskCanvasRef.current.width;
    newCanvas.height = maskCanvasRef.current.height;
    const ctx = newCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(maskCanvasRef.current, 0, 0);
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ canvas: newCanvas });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0 || !maskCanvasRef.current || history.length === 0) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx && history[newIndex]) {
      ctx.drawImage(history[newIndex].canvas, 0, 0);
      renderDisplay();
      updateSelection();
    }
  }, [history, historyIndex]);

  const renderDisplay = useCallback(() => {
    if (!displayCanvasRef.current || !maskCanvasRef.current || !imageRef.current) return;

    const ctx = displayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    
    ctx.drawImage(imageRef.current, 0, 0);
    
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvasRef.current, 0, 0);
    
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  const updateSelection = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const mask = maskCanvasRef.current.toDataURL();
    onSelectionChange?.(mask);
  }, [onSelectionChange]);

  const drawLassoPreview = useCallback(() => {
    if (!displayCanvasRef.current || !maskCanvasRef.current || !imageRef.current) return;

    const ctx = displayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    
    ctx.drawImage(imageRef.current, 0, 0);
    
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvasRef.current, 0, 0);
    
    ctx.globalCompositeOperation = 'source-over';

    if (points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (currentPoint) {
        ctx.lineTo(currentPoint.x, currentPoint.y);
      }
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    points.forEach((point, i) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#22c55e' : '#6366f1';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [points, currentPoint]);

  const isNearStartPoint = useCallback((point: Point): boolean => {
    if (points.length < 3) return false;
    const start = points[0];
    const distance = Math.sqrt(Math.pow(point.x - start.x, 2) + Math.pow(point.y - start.y, 2));
    return distance < 20;
  }, [points]);

  const fillLasso = useCallback(() => {
    if (points.length < 3 || !maskCanvasRef.current) return;

    saveHistory();

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();

    setPoints([]);
    setCurrentPoint(null);
    renderDisplay();
    updateSelection();
  }, [points, saveHistory, renderDisplay, updateSelection]);

  const drawBrush = useCallback((x: number, y: number, isErasing = false) => {
    if (!maskCanvasRef.current) return;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = isErasing ? 'black' : 'white';
    ctx.fill();
  }, [brushSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const coords = getImageCoords(e.clientX, e.clientY);

    if (tool === "lasso") {
      if (isNearStartPoint(coords) && points.length >= 3) {
        fillLasso();
        return;
      }
      setPoints(prev => [...prev, coords]);
    } else {
      setIsDrawing(true);
      saveHistory();
      drawBrush(coords.x, coords.y, tool === "eraser");
      renderDisplay();
    }
  }, [tool, getImageCoords, isNearStartPoint, points, fillLasso, saveHistory, drawBrush, renderDisplay]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const coords = getImageCoords(e.clientX, e.clientY);

    if (tool === "lasso") {
      setCurrentPoint(coords);
      drawLassoPreview();
    } else if (isDrawing) {
      drawBrush(coords.x, coords.y, tool === "eraser");
      renderDisplay();
    }
  }, [tool, isDrawing, getImageCoords, drawLassoPreview, drawBrush, renderDisplay]);

  const handleMouseUp = useCallback(() => {
    if (tool !== "lasso") {
      setIsDrawing(false);
      updateSelection();
    }
  }, [tool, updateSelection]);

  const clearSelection = useCallback(() => {
    if (!maskCanvasRef.current) return;

    saveHistory();
    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
    setPoints([]);
    setCurrentPoint(null);
    renderDisplay();
    updateSelection();
  }, [saveHistory, renderDisplay, updateSelection]);

  const invertSelection = useCallback(() => {
    if (!maskCanvasRef.current) return;

    saveHistory();
    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255 - imageData.data[i];
        imageData.data[i + 1] = 255 - imageData.data[i + 1];
        imageData.data[i + 2] = 255 - imageData.data[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
    }
    renderDisplay();
    updateSelection();
  }, [saveHistory, renderDisplay, updateSelection]);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      initCanvas();
    }
  }, [initCanvas]);

  const handleImageLoad = () => {
    initCanvas();
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <Button
            variant={tool === "lasso" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 w-9 p-0 rounded-lg",
              tool === "lasso" ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
            )}
            onClick={() => setTool("lasso")}
          >
            <Lasso className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === "brush" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 w-9 p-0 rounded-lg",
              tool === "brush" ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
            )}
            onClick={() => setTool("brush")}
          >
            <Paintbrush className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-9 w-9 p-0 rounded-lg",
              tool === "eraser" ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
            )}
            onClick={() => setTool("eraser")}
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg text-zinc-500 hover:text-zinc-300"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg text-zinc-500 hover:text-zinc-300"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <span className="text-xs text-zinc-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg text-zinc-500 hover:text-zinc-300"
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Brush size slider */}
      {(tool === "brush" || tool === "eraser") && (
        <div className="p-3 border-b border-white/[0.06] bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">大小</span>
            <div className="flex-1">
              <Slider
                value={[brushSize]}
                onValueChange={([v]) => setBrushSize(v)}
                min={5}
                max={100}
                step={5}
                className="py-1"
              />
            </div>
            <span className="text-xs text-zinc-500 w-10 text-right">
              {brushSize}px
            </span>
          </div>
        </div>
      )}

      {/* Lasso info */}
      {tool === "lasso" && (
        <div className="p-3 border-b border-white/[0.06] bg-[#0a0a0a]">
          <p className="text-xs text-zinc-500">
            点击添加锚点，点击起点闭合选区
          </p>
        </div>
      )}

      {/* Canvas area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-[#050505] cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%) scale(${zoom})` }}
        >
          <div className="relative">
            <img
              ref={imageRef}
              src={image}
              alt="Source"
              className="max-w-full max-h-full"
              onLoad={handleImageLoad}
              draggable={false}
            />
            
            <canvas
              ref={displayCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
            
            <canvas
              ref={tempCanvasRef}
              className="absolute top-0 left-0 pointer-events-none hidden"
            />
            
            <canvas
              ref={maskCanvasRef}
              className="absolute top-0 left-0 pointer-events-none hidden"
            />
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between p-3 border-t border-white/[0.06] bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-zinc-500 hover:text-zinc-300"
            onClick={clearSelection}
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            清除
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-zinc-500 hover:text-zinc-300"
            onClick={invertSelection}
          >
            <Move className="w-3.5 h-3.5 mr-1.5" />
            反选
          </Button>
        </div>
        <span className="text-xs text-zinc-600">
          {tool === "lasso" ? `锚点: ${points.length}` : ""}
        </span>
      </div>
    </div>
  );
}
