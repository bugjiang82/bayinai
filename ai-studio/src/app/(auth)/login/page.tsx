"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "请输入邮箱地址";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    if (!password) {
      newErrors.password = "请输入密码";
    } else if (password.length < 6) {
      newErrors.password = "密码长度至少为 6 位";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        remember: rememberMe,
      });

      if (result?.error) {
        setErrors({
          general: "登录失败，请检查邮箱和密码",
        });
      } else {
        // 登录成功，强制全页面跳转确保 session 生效
        window.location.href = "/generate";
      }
    } catch {
      setErrors({ general: "网络错误，请稍后重试" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-[fadeInUp_0.5s_ease-out_both]">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">欢迎回来</h1>
        <p className="text-sm text-zinc-400">
          登录你的账号，继续 AI 创作之旅
        </p>
      </div>

      {/* Error Alert */}
      {errors.general && (
        <div
          className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-300"
          >
            邮箱地址
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`h-11 pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 ${
                errors.email ? "border-destructive/50 focus-visible:ring-destructive/50" : ""
              }`}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-300"
            >
              密码
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              忘记密码？
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="输入密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`h-11 pl-10 pr-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 ${
                errors.password ? "border-destructive/50 focus-visible:ring-destructive/50" : ""
              }`}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-zinc-300 transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-white/[0.12] bg-white/[0.03] text-indigo-500 focus:ring-indigo-500/50"
            />
            记住我
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            忘记密码？
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 text-sm font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              登录中...
            </>
          ) : (
            "登录"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[#0a0a0a] text-zinc-500">或者</span>
        </div>
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-zinc-400">
        还没有账号？{" "}
        <Link
          href="/register"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
