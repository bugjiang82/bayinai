"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ImageModelId,
  ImageQuality,
  VideoModelId,
  VideoResolution,
} from "@/models";
import {
  getDefaultImageCost,
  getDefaultVideoCostPerSecond,
} from "@/services/creditPolicy.service";
import logger from "@/lib/logger";

// 客户端缓存：避免重复请求
const costCache = new Map<string, { cost: number; timestamp: number }>();
const CACHE_TTL = 30_000; // 30秒缓存

interface CreditPolicy {
  key: string;
  name: string;
  description?: string;
  cost: number;
  unit: string;
  category: string;
  isActive: boolean;
}

function getCacheKey(type: string, model?: string, qualityOrResolution?: string): string {
  return `${type}:${model || "default"}:${qualityOrResolution || "default"}`;
}

async function fetchCostFromApi(
  type: string,
  model?: string,
  qualityOrResolution?: string
): Promise<number> {
  const cacheKey = getCacheKey(type, model, qualityOrResolution);
  const cached = costCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.cost;
  }

  try {
    const body: Record<string, string> = { type, model: model || "" };
    if (qualityOrResolution) {
      // 根据类型使用 quality 或 resolution 字段
      if (type === "video") {
        body.resolution = qualityOrResolution;
      } else {
        body.quality = qualityOrResolution;
      }
    }
    const res = await fetch("/api/credits/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data?.cost !== undefined) {
      costCache.set(cacheKey, { cost: json.data.cost, timestamp: Date.now() });
      return json.data.cost;
    }
    throw new Error("Invalid response");
  } catch (err) {
    logger.error("获取积分策略失败, 使用本地默认值:", type, model, qualityOrResolution, err);
    // 降级到静态默认值
    if (type === "video") {
      return getDefaultVideoCostPerSecond(
        (model || "wan2.2-kf2v-flash") as VideoModelId,
        (qualityOrResolution || "720P") as VideoResolution
      );
    }
    return getDefaultImageCost(
      (model || "flash") as ImageModelId,
      (qualityOrResolution || "1K") as ImageQuality
    );
  }
}

export function useCreditPolicies() {
  const [policies, setPolicies] = useState<CreditPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/policies");
      if (!res.ok) throw new Error("获取积分策略失败");
      const data = await res.json();
      if (data.success && data.data) {
        setPolicies(data.data.policies || data.data || []);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setError(message);
      logger.error("Failed to fetch credit policies:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const startAutoSync = useCallback(
    (intervalMs: number = 30_000) => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      syncTimerRef.current = setInterval(fetchPolicies, intervalMs);
    },
    [fetchPolicies]
  );

  const stopAutoSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoSync();
  }, [stopAutoSync]);

  const clearCache = useCallback(() => {
    costCache.clear();
  }, []);

  const getImageCostFromApi = useCallback(
    (playerModelId: ImageModelId, quality: ImageQuality): number => {
      // 同步返回：先尝试从缓存获取，否则使用静态默认值
      const cacheKey = getCacheKey("text-to-image", playerModelId, quality);
      const cached = costCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.cost;
      }
      // 异步刷新缓存：传递 quality 到 API
      fetchCostFromApi("text-to-image", playerModelId, quality).catch(() => {});
      return getDefaultImageCost(playerModelId, quality);
    },
    []
  );

  const getVideoCostFromApi = useCallback(
    (
      playerModelId: VideoModelId,
      resolution: VideoResolution,
      duration?: number
    ): number => {
      const cacheKey = getCacheKey("video", playerModelId, resolution);
      const cached = costCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return duration ? cached.cost * duration : cached.cost;
      }
      // 异步刷新缓存：传递 resolution 到 API
      fetchCostFromApi("video", playerModelId, resolution).catch(() => {});
      const costPerSec = getDefaultVideoCostPerSecond(playerModelId, resolution);
      return duration ? costPerSec * duration : costPerSec;
    },
    []
  );

  const getCostByType = useCallback(
    async (type: string, model?: string, qualityOrResolution?: string): Promise<number> => {
      return fetchCostFromApi(type, model, qualityOrResolution);
    },
    []
  );

  return {
    policies,
    isLoading,
    loaded: !isLoading,
    error,
    lastSyncTime,
    getImageCostFromApi,
    getVideoCostFromApi,
    getCostByType,
    fetchPolicies,
    startAutoSync,
    stopAutoSync,
    clearCache,
  };
}

// 向后兼容：预加载积分策略（触发缓存预热）
export function prefetchCreditPolicies(): void {
  fetch("/api/credits/policies")
    .then((res) => res.json())
    .catch(() => {});
}