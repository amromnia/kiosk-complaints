import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام شكاوى ماكينات التجديد الذاتي - وزارة الداخلية",
  description: "نظام إدارة شكاوى ماكينات تجديد رخص تسيير المركبات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
