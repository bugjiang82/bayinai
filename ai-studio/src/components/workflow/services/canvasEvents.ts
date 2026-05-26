import { EventEmitter } from 'events';
import type { NodeData } from '../types';

export interface CanvasEventMap {
  'node:update': { nodeId: string; data: Partial<NodeData> };
  'node:delete': { nodeId: string };
  'node:add': { type: string; position: { x: number; y: number }; sourceNodeId?: string };
  'edge:add': { source: string; target: string; sourceHandle?: string };
  'project:save': { name: string; description: string };
  'project:load': { projectId: string };
}

class CanvasEventBus {
  private emitter = new EventEmitter();

  emit<K extends keyof CanvasEventMap>(event: K, payload: CanvasEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  on<K extends keyof CanvasEventMap>(event: K, listener: (payload: CanvasEventMap[K]) => void): void {
    this.emitter.on(event, listener);
  }

  off<K extends keyof CanvasEventMap>(event: K, listener: (payload: CanvasEventMap[K]) => void): void {
    this.emitter.off(event, listener);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const canvasEvents = new CanvasEventBus();