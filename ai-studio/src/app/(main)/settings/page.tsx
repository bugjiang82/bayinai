"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Shield,
  Bell,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

type SettingsTab = "profile" | "security" | "notifications";

const INDUSTRY_TAGS = [
  "互联网/科技",
  "广告/营销",
  "电商/零售",
  "教育/培训",
  "金融/保险",
  "医疗/健康",
  "媒体/娱乐",
  "制造业",
  "自由职业",
  "学生",
  "其他",
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile state
  const [nickname, setNickname] = useState("用户");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState({
    emailNotify: true,
    generationComplete: true,
    teamInvite: true,
    creditLow: true,
    newFeature: false,
    marketingEmail: false,
  });
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          industry: selectedIndustry,
        }),
      });
      if (res.ok) {
        setProfileMessage({ type: "success", text: "个人信息已更新" });
      } else {
        setProfileMessage({ type: "error", text: "更新失败，请重试" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: "error", text: "两次输入的密码不一致" });
      return;
    }

    setSecuritySaving(true);
    setSecurityMessage(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSecurityMessage({ type: "success", text: "密码修改成功" });
      } else {
        setSecurityMessage({ type: "error", text: "密码修改失败，请检查当前密码" });
      }
    } catch {
      setSecurityMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleBindPhone = async () => {
    if (!phone.trim()) return;
    setSecuritySaving(true);
    setSecurityMessage(null);
    try {
      const res = await fetch("/api/user/phone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (res.ok) {
        setSecurityMessage({ type: "success", text: "手机号绑定成功" });
      } else {
        setSecurityMessage({ type: "error", text: "绑定失败，请检查手机号" });
      }
    } catch {
      setSecurityMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotifySaving(true);
    setNotifyMessage(null);
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      if (res.ok) {
        setNotifyMessage({ type: "success", text: "通知偏好已更新" });
      } else {
        setNotifyMessage({ type: "error", text: "更新失败，请重试" });
      }
    } catch {
      setNotifyMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setNotifySaving(false);
    }
  };

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "个人信息", icon: <User className="h-4 w-4" /> },
    { key: "security", label: "账号安全", icon: <Shield className="h-4 w-4" /> },
    { key: "notifications", label: "通知偏好", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">账号设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理你的个人信息、安全设置和通知偏好
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left navigation */}
        <Card className="lg:w-56 shrink-0">
          <CardContent className="p-2">
            <nav className="flex flex-row lg:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                    activeTab === tab.key
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Right content */}
        <div className="flex-1">
          {/* Profile tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">个人信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-muted text-2xl font-medium">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          nickname.charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-transform hover:scale-110">
                      <Camera className="h-3.5 w-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      点击头像更换
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Nickname */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    昵称
                  </label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称"
                    className="max-w-sm"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    行业标签
                  </label>
                  <Select
                    value={selectedIndustry}
                    onValueChange={setSelectedIndustry}
                  >
                    <SelectTrigger className="max-w-sm">
                      <SelectValue placeholder="请选择你的行业" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_TAGS.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry quick tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    快速选择
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedIndustry(tag)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          selectedIndustry === tag
                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                            : "border-border bg-card text-muted-foreground hover:border-indigo-500/30 hover:text-foreground"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {profileMessage && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                      profileMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {profileMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {profileMessage.text}
                  </div>
                )}

                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    "保存中..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      保存修改
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Security tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change password */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    修改密码
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      当前密码
                    </label>
                    <div className="relative max-w-sm">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="请输入当前密码"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      新密码
                    </label>
                    <div className="relative max-w-sm">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="请输入新密码（至少8位）"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      确认新密码
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入新密码"
                      className="max-w-sm"
                    />
                  </div>

                  {securityMessage && (
                    <div
                      className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                        securityMessage.type === "success"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {securityMessage.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      {securityMessage.text}
                    </div>
                  )}

                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleChangePassword}
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      securitySaving
                    }
                  >
                    {securitySaving ? "修改中..." : "修改密码"}
                  </Button>
                </CardContent>
              </Card>

              {/* Bind phone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    绑定手机号
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      手机号码
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号码"
                      className="max-w-sm"
                      type="tel"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleBindPhone}
                    disabled={!phone.trim() || securitySaving}
                  >
                    绑定手机号
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">通知偏好</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Email notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        邮件通知
                      </p>
                      <p className="text-xs text-muted-foreground">
                        接收重要通知的邮件提醒
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotify}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          emailNotify: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  {/* Generation complete */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        生成完成通知
                      </p>
                      <p className="text-xs text-muted-foreground">
                        AI 生成任务完成时发送通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.generationComplete}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          generationComplete: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  {/* Team invite */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        团队邀请通知
                      </p>
                      <p className="text-xs text-muted-foreground">
                        收到团队邀请时发送通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.teamInvite}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          teamInvite: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  {/* Credit low */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        积分不足提醒
                      </p>
                      <p className="text-xs text-muted-foreground">
                        积分余额低于阈值时提醒充值
                      </p>
                    </div>
                    <Switch
                      checked={notifications.creditLow}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          creditLow: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  {/* New features */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        新功能通知
                      </p>
                      <p className="text-xs text-muted-foreground">
                        平台新功能和更新通知
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newFeature}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          newFeature: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  {/* Marketing */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        营销邮件
                      </p>
                      <p className="text-xs text-muted-foreground">
                        接收优惠活动和促销信息
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmail}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          marketingEmail: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {notifyMessage && (
                  <div
                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                      notifyMessage.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {notifyMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {notifyMessage.text}
                  </div>
                )}

                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleSaveNotifications}
                  disabled={notifySaving}
                >
                  {notifySaving ? (
                    "保存中..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      保存偏好
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
