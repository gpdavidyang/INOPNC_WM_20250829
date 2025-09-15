import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INOPNC",
  description: "Converted from static HTML to Next.js (App Router) + Tailwind",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="light">
      <head>
        {/* Google Fonts (kept to match original exactly) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet" />
        {/* Lucide (from base.html) */}
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" defer></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
