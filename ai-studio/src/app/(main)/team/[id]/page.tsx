"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Wallet,
  Calendar,
  Mail,
  UserPlus,
  Crown,
  Shield,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  avatar?: string;
}

interface TeamInfo {
  id: string;
  name: string;
  description: string;
  industry: string;
  createdAt: string;
  memberCount: number;
  sharedCredits: number;
}

interface TransferRecord {
  id: string;
  type: "in" | "out";
  description: string;
  amount: number;
  balance: number;
  createdAt: string;
  from?: string;
  to?: string;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  owner: {
    label: "创建者",
    icon: <Crown className="h-3 w-3" />,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  admin: {
    label: "管理员",
    icon: <Shield className="h-3 w-3" />,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  member: {
    label: "成员",
    icon: <User className="h-3 w-3" />,
    color: "bg-muted text-muted-foreground border-border",
  },
};

const MOCK_TEAM: TeamInfo = {
  id: "team-1",
  name: "创意设计组",
  description: "负责品牌视觉设计和创意内容制作",
  industry: "广告/营销",
  createdAt: "2025-01-10",
  memberCount: 8,
  sharedCredits: 5000,
};

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: "m1",
    name: "张三",
    email: "zhangsan@example.com",
    role: "owner",
    joinedAt: "2025-01-10",
  },
  {
    id: "m2",
    name: "李四",
    email: "lisi@example.com",
    role: "admin",
    joinedAt: "2025-01-12",
  },
  {
    id: "m3",
    name: "王五",
    email: "wangwu@example.com",
    role: "member",
    joinedAt: "2025-01-15",
  },
  {
    id: "m4",
    name: "赵六",
    email: "zhaoliu@example.com",
    role: "member",
    joinedAt: "2025-01-18",
  },
  {
    id: "m5",
    name: "孙七",
    email: "sunqi@example.com",
    role: "member",
    joinedAt: "2025-01-20",
  },
];

const MOCK_TRANSFERS: TransferRecord[] = [
  {
    id: "t1",
    type: "in",
    description: "张三 划转积分到团队",
    amount: 2000,
    balance: 5000,
    createdAt: "2025-01-20 14:30",
    from: "张三",
  },
  {
    id: "t2",
    type: "out",
    description: "李四 从团队划转积分",
    amount: -500,
    balance: 3000,
    createdAt: "2025-01-19 10:15",
    to: "李四",
  },
  {
    id: "t3",
    type: "in",
    description: "王五 划转积分到团队",
    amount: 1500,
    balance: 3500,
    createdAt: "2025-01-18 16:00",
    from: "王五",
  },
  {
    id: "t4",
    type: "out",
    description: "赵六 从团队划转积分",
    amount: -300,
    balance: 2000,
    createdAt: "2025-01-17 09:45",
    to: "赵六",
  },
];

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function fetchTeamDetail() {
      try {
        const res = await fetch(`/api/teams/${teamId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.data) {
            setTeam(data.data);
          } else {
            setTeam({ ...MOCK_TEAM, id: teamId });
          }
        } else {
          setTeam({ ...MOCK_TEAM, id: teamId });
        }

        const membersRes = await fetch(`/api/teams/${teamId}/members`);
        if (membersRes.ok) {
          const data = await membersRes.json();
          if (data.code === 0) {
            setMembers(data.data?.list || (Array.isArray(data.data) ? data.data : []));
          } else {
            setMembers(MOCK_MEMBERS);
          }
        } else {
          setMembers(MOCK_MEMBERS);
        }

        const transfersRes = await fetch(`/api/teams/${teamId}/transfers`);
        if (transfersRes.ok) {
          const data = await transfersRes.json();
          if (data.code === 0) {
            setTransfers(data.data?.list || (Array.isArray(data.data) ? data.data : []));
          } else {
            setTransfers(MOCK_TRANSFERS);
          }
        } else {
          setTransfers(MOCK_TRANSFERS);
        }
      } catch {
        setTeam({ ...MOCK_TEAM, id: teamId });
        setMembers(MOCK_MEMBERS);
        setTransfers(MOCK_TRANSFERS);
      } finally {
        setLoading(false);
      }
    }
    fetchTeamDetail();
  }, [teamId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteMessage(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (res.ok) {
        setInviteEmail("");
        setInviteMessage({ type: "success", text: "邀请已发送！" });
      } else {
        setInviteMessage({
          type: "error",
          text: "邀请失败，请检查邮箱地址",
        });
      }
    } catch {
      setInviteMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-xl bg-muted" />
            <div className="h-96 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">团队不存在或已被删除</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/team")}>
          返回团队列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/team")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {team.description}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">成员数</p>
              <p className="text-lg font-semibold text-foreground">
                {team.memberCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">团队积分</p>
              <p className="text-lg font-semibold text-foreground">
                {team.sharedCredits.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">创建时间</p>
              <p className="text-sm font-medium text-foreground">
                {team.createdAt}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Members */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">团队成员</CardTitle>
                <Badge variant="secondary">{members.length} 人</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {members.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-xs font-medium">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {member.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`gap-1 text-[10px] px-1.5 py-0 ${roleConfig.color}`}
                        >
                          {roleConfig.icon}
                          {roleConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      加入于 {member.joinedAt}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Invite member */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">邀请成员</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="请输入成员邮箱地址"
                  className="flex-1"
                  type="email"
                />
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                >
                  {inviting ? (
                    "发送中..."
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      邀请
                    </>
                  )}
                </Button>
              </div>
              {inviteMessage && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    inviteMessage.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {inviteMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {inviteMessage.text}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Transfer records */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">积分划转记录</CardTitle>
          </CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">暂无划转记录</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transfers.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                        record.type === "in"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {record.type === "in" ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {record.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.createdAt}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-medium shrink-0 ${
                        record.amount > 0
                          ? "text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {record.amount > 0 ? "+" : ""}
                      {record.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
