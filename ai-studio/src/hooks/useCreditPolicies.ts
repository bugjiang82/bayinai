import { useState, useEffect, useRef, useCallback } from "react";
import {
  getImageCost,
  getVideoCostPerSecond,
  createPolicyKey,
  type ImageModelId,
  type ImageQuality,
  type VideoModelId,
  type VideoResolution,
} from "@/models";

type PolicyMap = Record<string, { cost: number; unit: string }>;

let globalPolicies: PolicyMap | null = null;
let globalFetchPromise: Promise<void> | null = null;

async function fetchPolicies(): Promise<PolicyMap> {
  if (globalPolicies) return globalPolicies;

  if (!globalFetchPromise) {
    globalFetchPromise = (async () => {
      try {
        const res = await fetch("/api/credits/policies");
        const json = await res.json();
        if (json.success && json.data) {
          globalPolicies = json.data;
        }
      } catch {
        // ignore, use defaults
      } finally {
        globalFetchPromise = null;
      }
    })();
  }

  await globalFetchPromise;
  return globalPolicies || {};
}

export function prefetchCreditPolicies(): void {
  fetchPolicies();
}

export function useCreditPolicies() {
  const [policies, setPolicies] = useState<PolicyMap>(globalPolicies || {});
  const [loaded, setLoaded] = useState(!!globalPolicies);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;

    fetchPolicies().then((data) => {
      setPolicies(data);
      setLoaded(true);
    });
  }, []);

  const getPolicyCost = useCallback(
    (key: string): number | undefined => {
      return policies[key]?.cost;
    },
    [policies]
  );

  const getImageCostFromApi = useCallback(
    (modelId: ImageModelId, quality: ImageQuality): number => {
      const key = createPolicyKey(modelId, quality);
      const apiCost = policies[key]?.cost;
      if (apiCost !== undefined && apiCost > 0) return apiCost;
      return getImageCost(modelId, quality);
    },
    [policies]
  );

  const getVideoCostFromApi = useCallback(
    (modelId: VideoModelId, resolution: VideoResolution, duration?: number): number => {
      const key = createPolicyKey(modelId, resolution);
      const apiCost = policies[key]?.cost;
      const costPerSec =
        apiCost !== undefined && apiCost > 0 ? apiCost : getVideoCostPerSecond(modelId, resolution);
      return duration ? costPerSec * duration : costPerSec;
    },
    [policies]
  );

  const invalidateCache = useCallback(() => {
    globalPolicies = null;
    ref.current = false;
    setPolicies({});
    setLoaded(false);
    fetchPolicies().then((data) => {
      setPolicies(data);
      setLoaded(true);
    });
  }, []);

  return {
    policies,
    loaded,
    getPolicyCost,
    getImageCostFromApi,
    getVideoCostFromApi,
    invalidateCache,
  };
}