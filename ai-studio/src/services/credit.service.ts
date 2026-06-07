import prisma from "@/lib/prisma";

export type CreditType =
  | "RECHARGE"
  | "GENERATE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "BONUS"
  | "SIGN_IN";

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error("用户不存在");
  }

  return user.credits;
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditType,
  remark?: string
) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    const newBalance = user.credits + amount;

    await tx.user.update({
      where: { id: userId },
      data: { credits: newBalance },
    });

    const log = await tx.creditLog.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        remark,
      },
    });

    return { balance: newBalance, log };
  });
}

export async function deductCredits(
  userId: string,
  amount: number,
  remark?: string,
  refId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    if (user.credits < amount) {
      throw new Error("积分不足");
    }

    const newBalance = user.credits - amount;

    await tx.user.update({
      where: { id: userId },
      data: { credits: newBalance },
    });

    const log = await tx.creditLog.create({
      data: {
        userId,
        type: "GENERATE",
        amount: -amount,
        balance: newBalance,
        remark,
        refId,
      },
    });

    return { balance: newBalance, log };
  });
}

export interface CreditLogFilters {
  type?: CreditType;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  model?: string;
  search?: string;
  sortBy?: "amount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

const MODEL_DISPLAY_MAP: Record<string, string> = {
  flash: "Gemini 2.0 Flash",
  pro: "Gemini 2.5 Pro",
  "gemini-3.1-flash-image-preview": "Gemini 2.0 Flash",
  "gemini-3-pro-image-preview": "Gemini 2.5 Pro",
  image2: "GPT Image-2",
  "gpt-image-2": "GPT Image-2",
  sora2: "Sora 2",
  kling: "Kling",
  hailuo: "Hailuo",
};

const TYPE_DISPLAY_MAP: Record<string, string> = {
  GENERATE: "AI生成",
  RECHARGE: "充值",
  TRANSFER_IN: "转入",
  TRANSFER_OUT: "转出",
  BONUS: "赠送",
  SIGN_IN: "签到",
};

const TYPE_FEATURE_MAP: Record<string, string> = {
  TEXT_TO_IMAGE: "图片生成",
  IMAGE_TO_IMAGE: "图生图",
  VIDEO: "视频生成",
  EDIT: "图片编辑",
  INPAINT: "局部重绘",
  ARCHITECTURE: "建筑方案",
  AGENT_IMAGE: "AI绘图",
};

function resolveModelDisplay(modelKey: string): string {
  return MODEL_DISPLAY_MAP[modelKey] || modelKey;
}

function parseModelFromParams(params: string | null): string {
  if (!params) return "";
  try {
    const obj = JSON.parse(params);
    return obj.model || "";
  } catch {
    return "";
  }
}

function parseModelFromRemark(remark: string | null): string {
  if (!remark) return "";
  const match = remark.match(/\(([^)]+)\)/);
  return match ? match[1] : "";
}

export async function getLogs(userId: string, filters: CreditLogFilters = {}) {
  const { type, page = 1, pageSize = 20, startDate, endDate, minAmount, maxAmount, model, search, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const where: Record<string, unknown> = { userId };
  if (type) where.type = type;

  const createdAtFilter: Record<string, Date> = {};
  if (startDate) createdAtFilter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    createdAtFilter.lte = end;
  }
  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: Record<string, number> = {};
    if (minAmount !== undefined) amountFilter.gte = minAmount;
    if (maxAmount !== undefined) amountFilter.lte = maxAmount;
    where.amount = amountFilter;
  }

  if (search) {
    where.remark = { contains: search };
  }

  const [list, total] = await Promise.all([
    prisma.creditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.creditLog.count({ where }),
  ]);

  const generationIds = list
    .filter((item) => item.type === "GENERATE" && item.refId)
    .map((item) => item.refId!);

  const generationMap = new Map<string, { model: string; genType: string }>();
  if (generationIds.length > 0) {
    const generations = await prisma.generation.findMany({
      where: { id: { in: generationIds } },
      select: { id: true, params: true, type: true },
    });
    for (const gen of generations) {
      const modelFromParams = parseModelFromParams(gen.params);
      generationMap.set(gen.id, { model: modelFromParams, genType: gen.type });
    }
  }

  const enrichedList = list.map((item) => {
    let modelDisplay = "";
    let featureDisplay = TYPE_DISPLAY_MAP[item.type] || item.type;

    if (item.type === "GENERATE") {
      const genData = item.refId ? generationMap.get(item.refId) : null;
      let modelKey = "";
      if (genData?.model) {
        modelKey = genData.model;
      } else {
        modelKey = parseModelFromRemark(item.remark);
      }
      modelDisplay = resolveModelDisplay(modelKey);

      if (genData?.genType) {
        featureDisplay = TYPE_FEATURE_MAP[genData.genType] || genData.genType;
      } else {
        const remarkFeature = item.remark ? item.remark.replace(/\s*\([^)]*\)\s*/g, "").trim() : "";
        if (remarkFeature) featureDisplay = remarkFeature;
      }
    }

    return {
      id: item.id,
      type: item.type,
      amount: item.amount,
      balance: item.balance,
      remark: item.remark,
      refId: item.refId,
      createdAt: item.createdAt.toISOString(),
      modelDisplay,
      featureDisplay,
    };
  });

  if (model) {
    const filteredList = enrichedList.filter(
      (item) =>
        item.modelDisplay.toLowerCase().includes(model.toLowerCase()) ||
        (item.remark || "").toLowerCase().includes(model.toLowerCase())
    );
    return {
      list: filteredList,
      total: filteredList.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredList.length / pageSize),
    };
  }

  return {
    list: enrichedList,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function transfer(
  fromUserId: string,
  toUserId: string,
  amount: number,
  remark?: string
) {
  if (amount <= 0) {
    throw new Error("划转金额必须大于0");
  }

  if (fromUserId === toUserId) {
    throw new Error("不能向自己划转");
  }

  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { credits: true },
  });

  if (!fromUser || fromUser.credits < amount) {
    throw new Error("积分不足");
  }

  const toUser = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true, credits: true },
  });

  if (!toUser) {
    throw new Error("目标用户不存在");
  }

  // 使用事务确保原子性
  const result = await prisma.$transaction(async (tx) => {
    // 扣除转出方积分
    const newFromBalance = fromUser.credits - amount;
    await tx.user.update({
      where: { id: fromUserId },
      data: { credits: newFromBalance },
    });

    // 增加接收方积分
    const newToBalance = toUser.credits + amount;
    await tx.user.update({
      where: { id: toUserId },
      data: { credits: newToBalance },
    });

    // 创建转出方积分日志
    await tx.creditLog.create({
      data: {
        userId: fromUserId,
        type: "TRANSFER_OUT",
        amount: -amount,
        balance: newFromBalance,
        remark: remark || `划转给用户 ${toUserId}`,
      },
    });

    // 创建接收方积分日志
    await tx.creditLog.create({
      data: {
        userId: toUserId,
        type: "TRANSFER_IN",
        amount,
        balance: newToBalance,
        remark: remark || `来自用户 ${fromUserId} 的划转`,
      },
    });

    // 创建划转记录
    const transferRecord = await tx.creditTransfer.create({
      data: {
        fromUserId,
        toUserId,
        amount,
        status: "ACCEPTED",
        remark,
      },
    });

    return transferRecord;
  });

  return result;
}
