import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const figtree = Figtree({
  variable: "--font-figtree",
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
  return (
    <html lang="en">
      <body className={`${figtree.variable} antialiased min-h-screen bg-slate-50/30`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
