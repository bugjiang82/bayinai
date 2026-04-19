import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "六维AI工作平台",
  description:
    "AI Creative Studio - 利用人工智能释放你的创造力，生成图像、视频和更多创意内容",
  keywords: ["AI", "创意", "生成", "图像", "视频", "工作室"],
  authors: [{ name: "AI Creative Studio" }],
  openGraph: {
    title: "六维AI工作平台",
    description: "利用人工智能释放你的创造力",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
