import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";

// 类型定义
interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  prompt: string;
  createdAt: string;
  model: string;
  isFavorite: boolean;
  outputUrl?: string | null;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  cost: number;
}

interface GalleryData {
  list: GalleryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface PrismaWhere {
  userId: string;
  status: string;
  favorited?: boolean;
  type?: string | { in: string[] };
  createdAt?: { gte: Date; lt: Date };
  prompt?: { contains: string; mode: string };
}

// 服务端内存缓存
interface CacheEntry {
  data: GalleryData;
  timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 1分钟
const cache: Map<string, CacheEntry> = new Map();

function getCacheKey(userId: string, params: Record<string, string>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return `${userId}?${sortedParams}`;
}

function getCachedData(key: string): GalleryData | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData(key: string, data: GalleryData): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function getTimeRange(timeFilter: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  
  switch (timeFilter) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end,
      };
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end,
      };
    default:
      return { start: new Date(0), end };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);
    const typeFilter = searchParams.get('type') || 'all';
    const timeFilter = searchParams.get('time') || 'all';
    const searchQuery = searchParams.get('q');

    // 构建缓存键
    const cacheKey = getCacheKey(session.user.id, {
      page: String(page),
      pageSize: String(pageSize),
      type: typeFilter,
      time: timeFilter,
      q: searchQuery || '',
    });

    // 尝试从缓存获取数据
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(success(cachedData));
    }

    // 构建查询条件
    const where: PrismaWhere = {
      userId: session.user.id,
      status: 'COMPLETED',
      favorited: true,
    };

    // 类型过滤
    if (typeFilter === 'image') {
      where.type = {
        in: ['TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE', 'INPAINT', 'ARCHITECTURE'],
      };
    } else if (typeFilter === 'video') {
      where.type = 'TEXT_TO_VIDEO';
    }

    // 时间范围过滤
    if (timeFilter !== 'all') {
      const { start, end } = getTimeRange(timeFilter);
      where.createdAt = {
        gte: start,
        lt: end,
      };
    }

    // 搜索过滤
    if (searchQuery) {
      where.prompt = {
        contains: searchQuery,
        mode: 'insensitive',
      };
    }

    // 分页查询
    const [list, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.generation.count({ where }),
    ]);

    const data = {
      list: list.map((g: any) => ({
        id: g.id,
        type: (['TEXT_TO_VIDEO'].includes(g.type) ? 'video' : 'image') as 'image' | 'video',
        prompt: g.prompt,
        outputUrl: g.outputUrl,
        thumbnailUrl: g.thumbnailUrl,
        width: g.width,
        height: g.height,
        cost: g.cost,
        createdAt: g.createdAt.toISOString(),
        favorited: g.favorited ?? false,
        favoritedAt: g.favoritedAt?.toISOString() ?? null,
        thumbnail: g.thumbnailUrl || g.outputUrl || '',
        model: 'Gemini',
        isFavorite: g.favorited ?? false,
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };

    // 缓存结果
    setCachedData(cacheKey, data);

    return NextResponse.json(success(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取作品列表失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
