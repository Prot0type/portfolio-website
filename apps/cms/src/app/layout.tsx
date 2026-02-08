import type { Metadata } from "next";
import "@aws-amplify/ui-react/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio CMS",
  description: "Admin panel for managing portfolio projects."
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

