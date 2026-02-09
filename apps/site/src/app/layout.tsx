import type { Metadata } from "next";
import localFont from "next/font/local";

import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const stalemate = localFont({
  src: "./fonts/Stalemate-Regular.ttf",
  variable: "--font-stalemate",
  weight: "400"
});

const fredoka = localFont({
  src: "./fonts/Fredoka-VariableFont_wdth,wght.ttf",
  variable: "--font-fredoka",
  weight: "300 700"
});

export const metadata: Metadata = {
  title: "ishani churi | ux portfolio",
  description: "Portfolio website for Ishani Churi, UX designer."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${stalemate.variable} ${fredoka.variable}`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
