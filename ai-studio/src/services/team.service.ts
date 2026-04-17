import prisma from "@/lib/prisma";

export async function getTeams(userId: string) {
  // 获取用户拥有的团队和加入的团队
  const [ownedTeams, memberTeams] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: userId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
    }),
  ]);

  // 去重：如果用户既是 owner 又是 member，只保留 owner 角色
  const memberTeamIds = new Set(memberTeams.map((m) => m.teamId));
  const teams = [
    ...ownedTeams.map((t) => ({
      ...t,
      memberCount: t._count.members,
      role: "OWNER" as const,
    })),
    ...memberTeams
      .filter((m) => !memberTeamIds.has(m.teamId) || !ownedTeams.find((ot) => ot.id === m.teamId))
      .filter((m) => !ownedTeams.find((ot) => ot.id === m.teamId))
      .map((m) => ({
        ...m.team,
        memberCount: m.team._count.members,
        role: m.role,
      })),
  ];

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    avatar: t.avatar,
    role: t.role,
    memberCount: t.memberCount,
    members: t.members?.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user,
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function createTeam(
  userId: string,
  data: { name: string; description?: string; avatar?: string }
) {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      ownerId: userId,
    },
    include: {
      owner: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  // 创建者自动成为团队管理员
  await prisma.teamMember.create({
    data: {
      userId,
      teamId: team.id,
      role: "OWNER",
    },
  });

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    avatar: team.avatar,
    owner: team.owner,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export async function inviteMember(
  teamId: string,
  userId: string,
  targetUserId: string
) {
  // 检查邀请者是否是团队管理员
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    throw new Error("无权限邀请成员");
  }

  // 检查目标用户是否存在
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, avatar: true },
  });

  if (!targetUser) {
    throw new Error("目标用户不存在");
  }

  // 检查是否已是成员
  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: targetUserId, teamId } },
  });

  if (existingMember) {
    throw new Error("该用户已是团队成员");
  }

  const teamMember = await prisma.teamMember.create({
    data: {
      userId: targetUserId,
      teamId,
      role: "MEMBER",
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  return {
    id: teamMember.id,
    role: teamMember.role,
    joinedAt: teamMember.joinedAt.toISOString(),
    user: teamMember.user,
  };
}

export async function getTeamMembers(teamId: string) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: m.user,
  }));
}

export async function getTeamById(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: { id: true, name: true, avatar: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!team) {
    throw new Error("团队不存在");
  }

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    avatar: team.avatar,
    owner: team.owner,
    memberCount: team._count.members,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}
