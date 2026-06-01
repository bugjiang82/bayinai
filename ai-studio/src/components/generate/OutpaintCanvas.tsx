"use client";

import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Undo2, Redo2 } from "lucide-react";
import { useOutpaintStore, type HandleType, type BoundingBox, type AspectRatioType, type RenderDetails } from "@/store/outpaintStore";

export interface OutpaintCanvasRef {
  buildPaddedImage: () => Promise<string>;
  getBox: () => BoundingBox;
  resetBox: () => void;
}

interface OutpaintCanvasProps {
  imageSrc: string;
  className?: string;
}

const WORKSPACE_SIZE = 500;
const MAX_IMAGE_BOUND = 300;

const OutpaintCanvas = forwardRef<OutpaintCanvasRef, OutpaintCanvasProps>(
  function OutpaintCanvas({ imageSrc, className = "" }, ref) {
    const workspaceRef = useRef<HTMLDivElement>(null);

    const {
      box,
      setBox,
      renderDetails,
      setRenderDetails,
      aspectRatio,
      isProcessing,
      customRatio,
      expandLeft,
      expandRight,
      expandTop,
      expandBottom,
      setExpandAmounts,
      reset: resetStore,
      pushHistory,
      undo,
      redo,
    } = useOutpaintStore();

    const isDraggingRef = useRef(false);
    const dragTypeRef = useRef<"box" | HandleType | null>(null);
    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const dragStartBoxRef = useRef<BoundingBox>({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
      if (!imageSrc) return;

      const img = new Image();
      img.onload = () => {
        let imgW = img.naturalWidth;
        let imgH = img.naturalHeight;
        const ratio = imgW / imgH;

        if (ratio > 1) {
          imgW = MAX_IMAGE_BOUND;
          imgH = MAX_IMAGE_BOUND / ratio;
        } else {
          imgH = MAX_IMAGE_BOUND;
          imgW = MAX_IMAGE_BOUND * ratio;
        }

        const imgX = (WORKSPACE_SIZE - imgW) / 2;
        const imgY = (WORKSPACE_SIZE - imgH) / 2;

        const details = { imgX, imgY, imgW, imgH };
        setRenderDetails(details);
        setBox({ x: imgX, y: imgY, width: imgW, height: imgH });
        setExpandAmounts(0, 0, 0, 0);
      };
      img.src = imageSrc;
    }, [imageSrc, setRenderDetails, setBox, setExpandAmounts]);

    const computeExpandAmounts = useCallback(
      (currentBox: BoundingBox) => {
        const l = Math.max(0, Math.round(renderDetails.imgX - currentBox.x));
        const r = Math.max(0, Math.round(currentBox.x + currentBox.width - (renderDetails.imgX + renderDetails.imgW)));
        const t = Math.max(0, Math.round(renderDetails.imgY - currentBox.y));
        const b = Math.max(0, Math.round(currentBox.y + currentBox.height - (renderDetails.imgY + renderDetails.imgH)));
        setExpandAmounts(l, r, t, b);
      },
      [renderDetails, setExpandAmounts]
    );

    const previousAspectRatio = useRef(aspectRatio);
    const previousCustomRatio = useRef(customRatio);

    useEffect(() => {
      if (!imageSrc) return;
      if (aspectRatio === "free") return;

      const ratioChanged = previousAspectRatio.current !== aspectRatio || previousCustomRatio.current !== customRatio;
      previousAspectRatio.current = aspectRatio;
      previousCustomRatio.current = customRatio;

      let targetRatio: number | null = null;
      if (aspectRatio === "custom") {
        const parts = customRatio.split(":").map(Number);
        if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
          targetRatio = parts[0] / parts[1];
        }
      } else {
        const ratioMap: Record<string, number> = {
          "1:1": 1,
          "16:9": 16 / 9,
          "9:16": 9 / 16,
          "4:3": 4 / 3,
          "3:4": 3 / 4,
          "21:9": 21 / 9,
        };
        targetRatio = ratioMap[aspectRatio];
      }
      if (!targetRatio) return;

      const currentBox = useOutpaintStore.getState().box;
      const currentRatio = currentBox.width / currentBox.height;
      if (Math.abs(currentRatio - targetRatio) < 0.01 && !ratioChanged) return;

      const centerX = currentBox.x + currentBox.width / 2;
      const centerY = currentBox.y + currentBox.height / 2;
      let newW = currentBox.width;
      let newH = currentBox.height;

      if (currentRatio > targetRatio) {
        newH = currentBox.width / targetRatio;
      } else {
        newW = currentBox.height * targetRatio;
      }

      const constrained = {
        x: Math.max(0, centerX - newW / 2),
        y: Math.max(0, centerY - newH / 2),
        width: Math.min(newW, WORKSPACE_SIZE),
        height: Math.min(newH, WORKSPACE_SIZE),
      };

      setBox(constrained);
      computeExpandAmounts(constrained);
    }, [aspectRatio, customRatio, imageSrc, setBox, computeExpandAmounts]);

    const resetBox = useCallback(() => {
      setBox({
        x: renderDetails.imgX,
        y: renderDetails.imgY,
        width: renderDetails.imgW,
        height: renderDetails.imgH,
      });
      setExpandAmounts(0, 0, 0, 0);
    }, [renderDetails, setBox, setExpandAmounts]);

    useImperativeHandle(
      ref,
      () => ({
        buildPaddedImage: () => buildPaddedImageBase64(),
        getBox: () => box,
        resetBox,
      }),
      [box, aspectRatio, renderDetails, resetBox]
    );

    const buildPaddedImageBase64 = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const baseSize = 800;
          let canvasW = baseSize;
          let canvasH = baseSize;

          if (aspectRatio === "16:9") {
            canvasH = Math.round(baseSize * (9 / 16));
          } else if (aspectRatio === "9:16") {
            canvasW = Math.round(baseSize * (9 / 16));
          } else if (aspectRatio === "4:3") {
            canvasH = Math.round(baseSize * (3 / 4));
          } else if (aspectRatio === "3:4") {
            canvasW = Math.round(baseSize * (3 / 4));
          } else if (aspectRatio === "21:9") {
            canvasH = Math.round(baseSize * (9 / 21));
          } else if (aspectRatio === "custom") {
            const parts = customRatio.split(":").map(Number);
            if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
              if (parts[0] > parts[1]) {
                canvasH = Math.round(baseSize * (parts[1] / parts[0]));
              } else {
                canvasW = Math.round(baseSize * (parts[0] / parts[1]));
              }
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to create canvas 2D context"));
            return;
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvasW, canvasH);

          const currentBox = box;
          let boxX = currentBox.x;
          let boxY = currentBox.y;
          let boxW = currentBox.width;
          let boxH = currentBox.height;

          const boxRatio = boxW / boxH;
          const targetRatio = canvasW / canvasH;

          let renderBoxW = boxW;
          let renderBoxH = boxH;
          let renderBoxX = boxX;
          let renderBoxY = boxY;

          if (boxRatio < targetRatio) {
            renderBoxW = boxH * targetRatio;
            renderBoxX = boxX - (renderBoxW - boxW) / 2;
          } else {
            renderBoxH = boxW / targetRatio;
            renderBoxY = boxY - (renderBoxH - boxH) / 2;
          }

          const { imgX, imgY, imgW, imgH } = renderDetails;

          const relX = (imgX - renderBoxX) / renderBoxW;
          const relY = (imgY - renderBoxY) / renderBoxH;
          const relW = imgW / renderBoxW;
          const relH = imgH / renderBoxH;

          const targetImgX = relX * canvasW;
          const targetImgY = relY * canvasH;
          const targetImgW = relW * canvasW;
          const targetImgH = relH * canvasH;

          ctx.drawImage(img, targetImgX, targetImgY, targetImgW, targetImgH);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (e) => reject(e);
        img.src = imageSrc;
      });
    };

    const constrainBoxToAspectRatio = (
      b: BoundingBox,
      ratio: AspectRatioType,
      details: RenderDetails
    ): BoundingBox => {
      if (ratio === "free") return b;

      let targetRatio: number | null = null;
      if (ratio === "custom") {
        const parts = customRatio.split(":").map(Number);
        if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
          targetRatio = parts[0] / parts[1];
        }
      } else {
        const ratioMap: Record<string, number> = {
          "1:1": 1,
          "16:9": 16 / 9,
          "9:16": 9 / 16,
          "4:3": 4 / 3,
          "3:4": 3 / 4,
          "21:9": 21 / 9,
        };
        targetRatio = ratioMap[ratio];
      }
      if (!targetRatio) return b;

      const centerX = b.x + b.width / 2;
      const centerY = b.y + b.height / 2;

      let newW = b.width;
      let newH = b.height;
      const currentRatio = b.width / b.height;

      if (currentRatio > targetRatio) {
        newH = b.width / targetRatio;
      } else {
        newW = b.height * targetRatio;
      }

      const constrained: BoundingBox = {
        x: centerX - newW / 2,
        y: centerY - newH / 2,
        width: newW,
        height: newH,
      };

      const minX = details.imgX;
      const minY = details.imgY;
      const maxRight = details.imgX + details.imgW;
      const maxBottom = details.imgY + details.imgH;

      if (constrained.x > minX) {
        constrained.width += (constrained.x - minX);
        constrained.x = minX;
        constrained.height = constrained.width / targetRatio;
        constrained.y = centerY - constrained.height / 2;
      }
      if (constrained.y > minY) {
        constrained.height += (constrained.y - minY);
        constrained.y = minY;
        constrained.width = constrained.height * targetRatio;
        constrained.x = centerX - constrained.width / 2;
      }
      if (constrained.x + constrained.width < maxRight) {
        constrained.width = maxRight - constrained.x;
        constrained.height = constrained.width / targetRatio;
        constrained.y = centerY - constrained.height / 2;
      }
      if (constrained.y + constrained.height < maxBottom) {
        constrained.height = maxBottom - constrained.y;
        constrained.width = constrained.height * targetRatio;
        constrained.x = centerX - constrained.width / 2;
      }

      return constrained;
    };

    const handleMouseDown = (
      e: React.MouseEvent | React.TouchEvent,
      type: "box" | HandleType
    ) => {
      e.preventDefault();
      if (isProcessing) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      pushHistory(box);
      isDraggingRef.current = true;
      dragTypeRef.current = type;
      dragStartPosRef.current = { x: clientX, y: clientY };
      dragStartBoxRef.current = { ...box };
    };

    const handleMouseMove = useCallback(
      (e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current || !dragTypeRef.current || !workspaceRef.current) return;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const rect = workspaceRef.current.getBoundingClientRect();
        const scaleX = WORKSPACE_SIZE / rect.width;
        const scaleY = WORKSPACE_SIZE / rect.height;

        const deltaX = (clientX - dragStartPosRef.current.x) * scaleX;
        const deltaY = (clientY - dragStartPosRef.current.y) * scaleY;

        const { imgX, imgY, imgW, imgH } = renderDetails;
        const start = dragStartBoxRef.current;

        let newBox = { ...start };

        switch (dragTypeRef.current) {
          case "box":
            break;
          case "n": {
            const targetY = start.y + deltaY;
            newBox.y = Math.min(Math.max(0, targetY), imgY);
            newBox.height = start.y + start.height - newBox.y;
            break;
          }
          case "s": {
            const targetBottom = start.y + start.height + deltaY;
            const maxBottom = Math.max(imgY + imgH, Math.min(WORKSPACE_SIZE, targetBottom));
            newBox.height = maxBottom - start.y;
            break;
          }
          case "w": {
            const targetX = start.x + deltaX;
            newBox.x = Math.min(Math.max(0, targetX), imgX);
            newBox.width = start.x + start.width - newBox.x;
            break;
          }
          case "e": {
            const targetRight = start.x + start.width + deltaX;
            const maxRight = Math.max(imgX + imgW, Math.min(WORKSPACE_SIZE, targetRight));
            newBox.width = maxRight - start.x;
            break;
          }
          case "nw": {
            const ty = start.y + deltaY;
            newBox.y = Math.min(Math.max(0, ty), imgY);
            newBox.height = start.y + start.height - newBox.y;
            const tx = start.x + deltaX;
            newBox.x = Math.min(Math.max(0, tx), imgX);
            newBox.width = start.x + start.width - newBox.x;
            break;
          }
          case "ne": {
            const ty = start.y + deltaY;
            newBox.y = Math.min(Math.max(0, ty), imgY);
            newBox.height = start.y + start.height - newBox.y;
            const targetRight = start.x + start.width + deltaX;
            const maxRight = Math.max(imgX + imgW, Math.min(WORKSPACE_SIZE, targetRight));
            newBox.width = maxRight - start.x;
            break;
          }
          case "sw": {
            const targetBottom = start.y + start.height + deltaY;
            const maxBottom = Math.max(imgY + imgH, Math.min(WORKSPACE_SIZE, targetBottom));
            newBox.height = maxBottom - start.y;
            const tx = start.x + deltaX;
            newBox.x = Math.min(Math.max(0, tx), imgX);
            newBox.width = start.x + start.width - newBox.x;
            break;
          }
          case "se": {
            const targetBottom = start.y + start.height + deltaY;
            const maxBottom = Math.max(imgY + imgH, Math.min(WORKSPACE_SIZE, targetBottom));
            newBox.height = maxBottom - start.y;
            const targetRight = start.x + start.width + deltaX;
            const maxRight = Math.max(imgX + imgW, Math.min(WORKSPACE_SIZE, targetRight));
            newBox.width = maxRight - start.x;
            break;
          }
        }

        newBox = constrainBoxToAspectRatio(newBox, aspectRatio, renderDetails);

        setBox(newBox);
        computeExpandAmounts(newBox);
      },
      [renderDetails, setBox, computeExpandAmounts, aspectRatio]
    );

    const handleMouseUp = useCallback(() => {
      isDraggingRef.current = false;
      dragTypeRef.current = null;
    }, []);

    useEffect(() => {
      const moveHandler = (e: MouseEvent) => handleMouseMove(e);
      const upHandler = () => handleMouseUp();
      const touchMoveHandler = (e: TouchEvent) => {
        handleMouseMove(e);
      };
      const touchEndHandler = () => handleMouseUp();

      window.addEventListener("mousemove", moveHandler);
      window.addEventListener("mouseup", upHandler);
      window.addEventListener("touchmove", touchMoveHandler, { passive: false });
      window.addEventListener("touchend", touchEndHandler);

      return () => {
        window.removeEventListener("mousemove", moveHandler);
        window.removeEventListener("mouseup", upHandler);
        window.removeEventListener("touchmove", touchMoveHandler);
        window.removeEventListener("touchend", touchEndHandler);
      };
    }, [handleMouseMove, handleMouseUp]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isProcessing) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
          e.preventDefault();
          redo();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo, isProcessing]);

    const isExpandingLeft = expandLeft > 3;
    const isExpandingRight = expandRight > 3;
    const isExpandingTop = expandTop > 3;
    const isExpandingBottom = expandBottom > 3;

    return (
      <div className={`flex flex-col bg-[#050505] ${className}`}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">拖拽节点扩展画布</span>
            <span className="text-[10px] bg-white/[0.06] text-zinc-500 px-1.5 py-0.5 rounded">
              交互模式
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={isProcessing}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 bg-white/[0.04] hover:bg-white/[0.08] px-1.5 py-1 rounded transition cursor-pointer"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3" />
            </button>
            <button
              onClick={redo}
              disabled={isProcessing}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 bg-white/[0.04] hover:bg-white/[0.08] px-1.5 py-1 rounded transition cursor-pointer"
              title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3 h-3" />
            </button>
            <button
              onClick={resetBox}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1 rounded transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              重置
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div
            ref={workspaceRef}
            className="relative rounded-xl border border-dashed border-white/[0.08] overflow-hidden shadow-2xl"
            style={{
              width: `${WORKSPACE_SIZE}px`,
              height: `${WORKSPACE_SIZE}px`,
              backgroundImage:
                "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            <div
              className="absolute pointer-events-none select-none opacity-25"
              style={{
                left: `${renderDetails.imgX}px`,
                top: `${renderDetails.imgY}px`,
                width: `${renderDetails.imgW}px`,
                height: `${renderDetails.imgH}px`,
              }}
            >
              <img
                src={imageSrc}
                alt="参考图"
                className="w-full h-full object-cover blur-xs"
              />
            </div>

            <div
              className="absolute pointer-events-none border border-dashed border-indigo-400/40"
              style={{
                left: `${box.x}px`,
                top: `${box.y}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
                backgroundImage:
                  "radial-gradient(#6366f1 1px, transparent 1px)",
                backgroundSize: "12px 12px",
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-indigo-400/80 bg-black/70 px-2 py-0.5 rounded-full">
                  扩展生成画布
                </span>
              </div>
            </div>

            <div
              className="absolute select-none overflow-hidden border border-white/[0.08] shadow-lg"
              style={{
                left: `${renderDetails.imgX}px`,
                top: `${renderDetails.imgY}px`,
                width: `${renderDetails.imgW}px`,
                height: `${renderDetails.imgH}px`,
              }}
            >
              <img
                src={imageSrc}
                alt="原图"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>

            <div
              className="absolute border-2 border-indigo-500 shadow-indigo-500/10 shadow-2xl"
              style={{
                left: `${box.x}px`,
                top: `${box.y}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
              }}
            >
              <div
                onMouseDown={(e) => handleMouseDown(e, "nw")}
                onTouchStart={(e) => handleMouseDown(e, "nw")}
                className="absolute w-5 h-5 -top-2.5 -left-2.5 border-2 border-indigo-400 bg-white hover:bg-indigo-300 rounded-full cursor-nwse-resize shadow-lg z-10 hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, "ne")}
                onTouchStart={(e) => handleMouseDown(e, "ne")}
                className="absolute w-5 h-5 -top-2.5 -right-2.5 border-2 border-indigo-400 bg-white hover:bg-indigo-300 rounded-full cursor-nesw-resize shadow-lg z-10 hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, "sw")}
                onTouchStart={(e) => handleMouseDown(e, "sw")}
                className="absolute w-5 h-5 -bottom-2.5 -left-2.5 border-2 border-indigo-400 bg-white hover:bg-indigo-300 rounded-full cursor-nesw-resize shadow-lg z-10 hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => handleMouseDown(e, "se")}
                onTouchStart={(e) => handleMouseDown(e, "se")}
                className="absolute w-5 h-5 -bottom-2.5 -right-2.5 border-2 border-indigo-400 bg-white hover:bg-indigo-300 rounded-full cursor-nwse-resize shadow-lg z-10 hover:scale-125 transition-transform"
              />

              <div
                onMouseDown={(e) => handleMouseDown(e, "n")}
                onTouchStart={(e) => handleMouseDown(e, "n")}
                className="absolute h-3 left-3 right-3 -top-1.5 cursor-ns-resize z-10 flex justify-center items-center"
              >
                <div className="w-5 h-2 bg-indigo-500 border border-white rounded-full shadow hover:bg-indigo-300" />
              </div>
              <div
                onMouseDown={(e) => handleMouseDown(e, "s")}
                onTouchStart={(e) => handleMouseDown(e, "s")}
                className="absolute h-3 left-3 right-3 -bottom-1.5 cursor-ns-resize z-10 flex justify-center items-center"
              >
                <div className="w-5 h-2 bg-indigo-500 border border-white rounded-full shadow hover:bg-indigo-300" />
              </div>
              <div
                onMouseDown={(e) => handleMouseDown(e, "w")}
                onTouchStart={(e) => handleMouseDown(e, "w")}
                className="absolute w-3 top-3 bottom-3 -left-1.5 cursor-ew-resize z-10 flex justify-center items-center"
              >
                <div className="h-5 w-2 bg-indigo-500 border border-white rounded-full shadow hover:bg-indigo-300" />
              </div>
              <div
                onMouseDown={(e) => handleMouseDown(e, "e")}
                onTouchStart={(e) => handleMouseDown(e, "e")}
                className="absolute w-3 top-3 bottom-3 -right-1.5 cursor-ew-resize z-10 flex justify-center items-center"
              >
                <div className="h-5 w-2 bg-indigo-500 border border-white rounded-full shadow hover:bg-indigo-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-black/40 border-t border-white/[0.06] flex flex-wrap gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <ArrowLeft className={`w-3 h-3 ${isExpandingLeft ? "text-emerald-400" : "text-zinc-600"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isExpandingLeft ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
            左: <strong className="text-zinc-300">{expandLeft}px</strong>
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight className={`w-3 h-3 ${isExpandingRight ? "text-emerald-400" : "text-zinc-600"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isExpandingRight ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
            右: <strong className="text-zinc-300">{expandRight}px</strong>
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp className={`w-3 h-3 ${isExpandingTop ? "text-emerald-400" : "text-zinc-600"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isExpandingTop ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
            上: <strong className="text-zinc-300">{expandTop}px</strong>
          </span>
          <span className="flex items-center gap-1">
            <ArrowDown className={`w-3 h-3 ${isExpandingBottom ? "text-emerald-400" : "text-zinc-600"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isExpandingBottom ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"}`} />
            下: <strong className="text-zinc-300">{expandBottom}px</strong>
          </span>
        </div>
      </div>
    );
  }
);

export default OutpaintCanvas;