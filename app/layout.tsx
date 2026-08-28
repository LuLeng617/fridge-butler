import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "冰箱管家｜我的冰箱",
  description: "簡單管理家裡的食材與保存期限。",
};

export const viewport: Viewport = {
  themeColor: "#f6f8f3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
