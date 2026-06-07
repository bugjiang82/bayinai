"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "概览", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/content", label: "内容管理", icon: FileText },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export function AdminHeader() {
  const pathname = usePathname();

  const currentLabel =
    NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label || "概览";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.01]">
      <div className="flex items-center gap-3">
        <div className="flex lg:hidden items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                pathname.startsWith(item.href)
                  ? "bg-indigo-500/10 text-indigo-300"
                  : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
            </Link>
          ))}
        </div>
        <h1 className="text-lg font-semibold text-white">{currentLabel}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
          A
        </div>
      </div>
    </header>
  );
}