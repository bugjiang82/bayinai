"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Sparkles,
  Bot,
  LayoutTemplate,
  Image,
  Coins,
  Users,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "首页", icon: Home },
  { href: "/generate", label: "生成", icon: Sparkles },
  { href: "/agents", label: "智能体", icon: Bot },
  { href: "/templates", label: "模板", icon: LayoutTemplate },
  { href: "/gallery", label: "作品", icon: Image },
  { href: "/credits", label: "积分", icon: Coins },
  { href: "/team", label: "团队", icon: Users },
  { href: "/all-round-test", label: "全能测试", icon: Bot },
];

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  credits?: number;
}

export default function Header({ user, credits = 0 }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl bg-black/60 border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-[1920px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:inline">
            AI创意工作室
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-white bg-white/[0.08]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Credits */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-zinc-200">
                  {credits.toLocaleString()}
                </span>
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || "用户"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name || "用户"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive"
                    onClick={async () => {
                      await signOut({ callbackUrl: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#0f0f0f] border-white/[0.06]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    AI创意工作室
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "text-white bg-white/[0.08]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              {user && (
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 px-3 mb-4">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-zinc-300">
                      积分余额：
                      <span className="font-semibold text-white">
                        {credits.toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
