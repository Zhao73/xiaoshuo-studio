import type { Metadata } from "next";
import { Alegreya, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

const displayFont = Alegreya({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700", "800"],
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Xiaoshuo Studio",
  description:
    "Local Codex-powered fiction workbench for drafting, style study, and anti-AI revision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
