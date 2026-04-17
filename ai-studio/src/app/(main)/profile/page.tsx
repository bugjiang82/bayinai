"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Calendar,
  Coins,
  Image,
  Sparkles,
  Crown,
} from "lucide-react";

interface UserProfile {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  credits?: number;
  industry?: string | null;
  createdAt?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.code === 0 && json.data) {
            setProfile(json.data);
          }
        }
      } catch {
        // 静默处理
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">个人中心</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded-full w-20 mx-auto mb-4" />
                <div className="h-5 bg-muted rounded w-1/2 mx-auto mb-2" />
                <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">个人中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 用户信息卡片 */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage
                src={profile.image || undefined}
                alt={profile.name || "用户"}
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                {profile.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold mb-1">
              {profile.name || "用户"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {profile.email || "未设置邮箱"}
            </p>
            {profile.industry && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <Crown className="h-3 w-3" />
                {profile.industry}
              </div>
            )}
            <Separator className="my-4" />
            <div className="w-full space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  邮箱
                </span>
                <span className="font-medium truncate max-w-[160px]">
                  {profile.email || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  注册时间
                </span>
                <span className="font-medium">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("zh-CN")
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  积分余额
                </span>
                <span className="font-semibold text-primary">
                  {profile.credits?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计和快捷操作 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Image className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">我的作品</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">生成次数</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {profile.credits?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">积分余额</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => (window.location.href = "/generate/text-to-image")}
              >
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">文生图</div>
                  <div className="text-xs text-muted-foreground">
                    输入文字描述，AI 生成图片
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => (window.location.href = "/generate/image-to-image")}
              >
                <Image className="h-4 w-4 text-purple-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">图生图</div>
                  <div className="text-xs text-muted-foreground">
                    上传参考图，AI 生成新方案
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => (window.location.href = "/templates")}
              >
                <User className="h-4 w-4 text-emerald-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">浏览模板</div>
                  <div className="text-xs text-muted-foreground">
                    使用预设模板快速创作
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
