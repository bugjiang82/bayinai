import prisma from "@/lib/prisma";

export interface TemplateFilters {
  category?: string;
  page?: number;
  pageSize?: number;
}

export async function getTemplates(filters: TemplateFilters = {}) {
  const { category, page = 1, pageSize = 20 } = filters;

  const where: Record<string, unknown> = { isPublic: true };
  if (category) where.category = category;

  const [list, total] = await Promise.all([
    prisma.template.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.template.count({ where }),
  ]);

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export interface CreateTemplateData {
  title: string;
  description?: string;
  coverImage?: string;
  category: string;
  tags?: string[];
  prompt: string;
  negativePrompt?: string;
  params?: Record<string, unknown>;
  isPublic?: boolean;
  userId: string;
}

export async function createTemplate(data: CreateTemplateData) {
  const template = await prisma.template.create({
    data: {
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      category: data.category,
      tags: data.tags || [],
      prompt: data.prompt,
      negativePrompt: data.negativePrompt,
      params: (data.params || {}) as any,
      isPublic: data.isPublic ?? true,
      userId: data.userId,
    },
  });

  return template;
}
