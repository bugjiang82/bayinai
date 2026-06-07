"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Shield,
  ArrowLeft,
  Coins,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "概览", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/content", label: "内容管理", icon: FileText },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

const OTHER_LINKS = [
  { href: "/admin/credit-policies", label: "积分策略", icon: Coins },
  { href: "/admin/docs", label: "开发文档", icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-white/[0.01] hidden lg:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">管理后台</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
              pathname.startsWith(item.href)
                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300 border border-transparent"
            )}
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </Link>
        ))}

        <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-1">
          {OTHER_LINKS.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-300"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-300"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            返回前台
          </Link>
        </Button>
      </div>
    </aside>
  );
}