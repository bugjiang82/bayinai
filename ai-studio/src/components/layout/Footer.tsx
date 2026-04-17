import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Sparkles, Mail, ExternalLink } from "lucide-react";

const footerLinks = {
  product: {
    title: "产品介绍",
    links: [
      { label: "AI图像生成", href: "/generate" },
      { label: "视频生成", href: "/generate?mode=video" },
      { label: "智能体", href: "/agents" },
      { label: "模板市场", href: "/templates" },
      { label: "API接口", href: "/docs" },
    ],
  },
  quickLinks: {
    title: "快速链接",
    links: [
      { label: "作品画廊", href: "/gallery" },
      { label: "积分充值", href: "/credits" },
      { label: "团队协作", href: "/team" },
      { label: "帮助中心", href: "/help" },
      { label: "更新日志", href: "/changelog" },
    ],
  },
  contact: {
    title: "联系方式",
    links: [
      { label: "support@ai-studio.com", href: "mailto:support@ai-studio.com" },
      { label: "GitHub", href: "https://github.com" },
      { label: "Twitter / X", href: "https://twitter.com" },
    ],
  },
};

export default function Footer() {
  const { data: session } = useSession();

  // 登录后不显示页脚
  if (session?.user) {
    return null;
  }

  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0a]">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI创意工作室
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              利用人工智能释放你的创造力，生成图像、视频和更多创意内容。
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">
              {footerLinks.product.title}
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.product.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">
              {footerLinks.quickLinks.title}
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.quickLinks.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">
              {footerLinks.contact.title}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={footerLinks.contact.links[0].href}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {footerLinks.contact.links[0].label}
                </Link>
              </li>
              <li>
                <Link
                  href={footerLinks.contact.links[1].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {footerLinks.contact.links[1].label}
                </Link>
              </li>
              <li>
                <Link
                  href={footerLinks.contact.links[2].href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {footerLinks.contact.links[2].label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} AI创意工作室. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              隐私政策
            </Link>
            <Link
              href="/terms"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
