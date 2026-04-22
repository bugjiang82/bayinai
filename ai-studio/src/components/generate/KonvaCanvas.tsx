import React, { useRef, useState, useCallback, createContext, useContext, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Group } from 'react-konva';
import { useEditStore } from '@/store/editStore';
import useImage from 'use-image';

interface KonvaCanvasProps {
  className?: string;
}

interface KonvaCanvasRef {
  generateMask: () => string | null;
}

const KonvaCanvas = forwardRef<KonvaCanvasRef, KonvaCanvasProps>(({ className = "" }, ref) => {
  const {
    currentImage,
    tool,
    brushColor,
    brushSize,
    shapes,
    addShape,
    selectionPath,
    setSelectionPath,
    setTool
  } = useEditStore();

  const [image] = useImage(currentImage || '');
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[] | null>(null);
  const [newShape, setNewShape] = useState<{ id: string; type: 'rect' | 'circle'; x: number; y: number; width?: number; height?: number; radius?: number; stroke: string; strokeWidth: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const animationFrameRef = useRef<number>();

  // 检测图片尺寸并计算合适的显示尺寸
  useEffect(() => {
    if (image && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth - 32; // 减去 padding
      const containerHeight = container.offsetHeight - 32;

      const imgWidth = image.width || 800;
      const imgHeight = image.height || 600;

      // 计算宽高比
      const imgRatio = imgWidth / imgHeight;
      const containerRatio = containerWidth / containerHeight;

      let displayWidth, displayHeight;

      if (imgWidth <= containerWidth && imgHeight <= containerHeight) {
        // 图片小于容器，居中显示，不放大
        displayWidth = imgWidth;
        displayHeight = imgHeight;
      } else {
        // 图片大于容器，按比例缩小
        if (imgRatio > containerRatio) {
          displayWidth = containerWidth;
          displayHeight = containerWidth / imgRatio;
        } else {
          displayHeight = containerHeight;
          displayWidth = containerHeight * imgRatio;
        }
      }

      setStageSize({
        width: Math.floor(displayWidth),
        height: Math.floor(displayHeight)
      });
    }
  }, [image]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const generateMask = useCallback(() => {
    if (!stageRef.current) return null;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const stage = stageRef.current;
      canvas.width = stage.width();
      canvas.height = stage.height();

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;

      shapes.forEach(shape => {
        if (shape.type === 'path') {
          ctx.beginPath();
          ctx.moveTo(shape.points[0], shape.points[1]);
          for (let i = 2; i < shape.points.length; i += 2) {
            ctx.lineTo(shape.points[i], shape.points[i + 1]);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (shape.type === 'rect' && shape.isSelection) {
          ctx.fillRect(shape.x!, shape.y!, shape.width || 0, shape.height || 0);
          ctx.strokeRect(shape.x!, shape.y!, shape.width || 0, shape.height || 0);
        } else if (shape.type === 'circle' && shape.isSelection) {
          ctx.beginPath();
          ctx.arc(shape.x!, shape.y!, shape.radius || 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });

      if (selectionPath && selectionPath.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(selectionPath[0], selectionPath[1]);
        for (let i = 2; i < selectionPath.length; i += 2) {
          ctx.lineTo(selectionPath[i], selectionPath[i + 1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('生成 mask 失败:', error);
      return null;
    }
  }, [shapes, selectionPath]);

  useImperativeHandle(ref, () => ({
    generateMask
  }), [generateMask]);

  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();

    if (tool === 'brush' || tool === 'eraser') {
      setIsDrawing(true);
      setCurrentLine([pos.x, pos.y]);
    } else if (tool === 'lasso' || tool === 'polygon') {
      const currentPath = selectionPath || [];

      if (currentPath.length >= 4) {
        const startX = currentPath[0];
        const startY = currentPath[1];
        const dist = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));

        if (dist < 15) {
          setTool('select');
          return;
        }
      }

      setSelectionPath([...currentPath, pos.x, pos.y]);
    } else if (tool === 'rect') {
      setIsDrawing(true);
      setNewShape({
        id: Math.random().toString(36),
        type: 'rect',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: brushColor,
        strokeWidth: 2,
      });
    } else if (tool === 'circle') {
      setIsDrawing(true);
      setNewShape({
        id: Math.random().toString(36),
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        stroke: brushColor,
        strokeWidth: 2,
      });
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setMousePos(pos);

      if (!isDrawing) return;

      if (tool === 'brush' || tool === 'eraser') {
        setCurrentLine((prev) => prev ? [...prev, pos.x, pos.y] : [pos.x, pos.y]);
      } else if (tool === 'rect' && newShape) {
        setNewShape({
          ...newShape,
          width: pos.x - newShape.x,
          height: pos.y - newShape.y,
        });
      } else if (tool === 'circle' && newShape) {
        const radius = Math.sqrt(
          Math.pow(pos.x - newShape.x, 2) + Math.pow(pos.y - newShape.y, 2)
        );
        setNewShape({
          ...newShape,
          radius,
        });
      }
    });
  };

  const handleMouseUp = () => {
    if (tool === 'lasso') return;

    setIsDrawing(false);
    if ((tool === 'brush' || tool === 'eraser') && currentLine) {
      addShape({
        id: Math.random().toString(36),
        type: 'path',
        points: currentLine,
        stroke: brushColor,
        strokeWidth: brushSize,
        tool: tool,
      });
      setCurrentLine(null);
    } else if (tool === 'rect' || tool === 'circle') {
      if (newShape) {
        addShape({
          ...newShape,
          isSelection: true
        });
      }
      setNewShape(null);
    }
  };

  const handleDblClick = () => {
    if ((tool === 'lasso' || tool === 'polygon') && selectionPath && selectionPath.length >= 4) {
      setTool('select');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex items-center justify-center p-8 bg-[#050505] overflow-hidden ${className}`}
    >
      <div className="canvas-container relative rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDblClick={handleDblClick}
          ref={stageRef}
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={stageSize.width}
                height={stageSize.height}
                listening={false}
              />
            )}

            {shapes.map((shape) => (
              <Group key={shape.id}>
                {shape.type === 'path' && (
                  <Line
                    points={shape.points}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={shape.tool === 'eraser' ? 'destination-out' : 'source-over'}
                  />
                )}
                {shape.type === 'rect' && (
                  <Rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.isSelection ? 'rgba(252, 211, 77, 0.2)' : 'transparent'}
                    dash={shape.isSelection ? [5, 5] : []}
                  />
                )}
                {shape.type === 'circle' && (
                  <Circle
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius || 0}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.isSelection ? 'rgba(252, 211, 77, 0.2)' : 'transparent'}
                    dash={shape.isSelection ? [5, 5] : []}
                  />
                )}
              </Group>
            ))}

            {currentLine && (
              <Line
                points={currentLine}
                stroke={brushColor}
                strokeWidth={brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={tool === 'eraser' ? 'destination-out' : 'source-over'}
              />
            )}

            {selectionPath && (
              <Group>
                <Line
                  points={(tool === 'lasso' || tool === 'polygon') ? [...selectionPath, mousePos.x, mousePos.y] : selectionPath}
                  stroke="#00FFFF"
                  strokeWidth={2}
                  dash={[10, 5]}
                  fill="rgba(0, 255, 255, 0.2)"
                  closed={selectionPath.length >= 4}
                />
                {Array.from({ length: selectionPath.length / 2 }).map((_, i) => {
                  const isFirst = i === 0;
                  const x = selectionPath[i * 2];
                  const y = selectionPath[i * 2 + 1];
                  const isHovering = isFirst &&
                    Math.sqrt(Math.pow(mousePos.x - x, 2) + Math.pow(mousePos.y - y, 2)) < 15;

                  return (
                    <Circle
                      key={i}
                      x={x}
                      y={y}
                      radius={isFirst && isHovering ? 6 : 3}
                      fill={isFirst && isHovering ? "#fff" : "#00FFFF"}
                      stroke="white"
                      strokeWidth={2}
                      shadowBlur={isFirst && isHovering ? 10 : 0}
                      shadowColor="#00FFFF"
                    />
                  );
                })}
              </Group>
            )}

            {newShape && (
              <>
                {newShape.type === 'rect' && (
                  <Rect
                    {...newShape}
                    dash={[5, 5]}
                  />
                )}
                {newShape.type === 'circle' && (
                  <Circle
                    {...newShape}
                    dash={[5, 5]}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
});

export default React.memo(KonvaCanvas);