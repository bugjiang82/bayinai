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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error("用户不存在");
  }

  const newBalance = user.credits + amount;

  await prisma.user.update({
    where: { id: userId },
    data: { credits: newBalance },
  });

  const log = await prisma.creditLog.create({
    data: {
      userId,
      type,
      amount,
      balance: newBalance,
      remark,
    },
  });

  return { balance: newBalance, log };
}

export async function deductCredits(
  userId: string,
  amount: number,
  remark?: string,
  refId?: string
) {
  const user = await prisma.user.findUnique({
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

  await prisma.user.update({
    where: { id: userId },
    data: { credits: newBalance },
  });

  const log = await prisma.creditLog.create({
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
}

export interface CreditLogFilters {
  type?: CreditType;
  page?: number;
  pageSize?: number;
}

export async function getLogs(userId: string, filters: CreditLogFilters = {}) {
  const { type, page = 1, pageSize = 20 } = filters;

  const where: Record<string, unknown> = { userId };
  if (type) where.type = type;

  const [list, total] = await Promise.all([
    prisma.creditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.creditLog.count({ where }),
  ]);

  return {
    list: list.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
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
