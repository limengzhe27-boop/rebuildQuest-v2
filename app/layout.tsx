import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JoyData 问卷工作台",
  description: "面向全球玩家的多语言问卷创建、发布与分析工作台。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
