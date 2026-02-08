import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ishani Churi | Portfolio",
  description: "Interactive portfolio website for selected projects and experiments."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

