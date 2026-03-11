import type { Metadata } from "next";
import { Inter, VT323, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { getInaraVariables } from "@/lib/inara-colors";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nJudge - Distributed VJudge",
  description: "Bypass Cloudflare and submit to Codeforces/AtCoder directly from your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const inaraVars = getInaraVariables();

  return (
    <html lang="en" style={inaraVars as React.CSSProperties}>
      <body className={`${inter.variable} ${jetbrains.variable} ${vt323.variable} antialiased min-h-screen bg-inara-bg transition-colors duration-500`}>
        <Navbar />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
