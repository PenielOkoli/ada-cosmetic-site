import type { Metadata } from "next";
import "./globals.css";

// Request-specific CSP nonces require dynamic HTML, not a static cached page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GARDIN Cosmetics — Coming Soon",
  description: "Gourmand body care for skin worth indulging.",
  icons: {
    icon: "/icon.svg?v=gc-leaf-pink-ffa2b9",
    shortcut: "/icon.svg?v=gc-leaf-pink-ffa2b9",
    apple: "/icon.svg?v=gc-leaf-pink-ffa2b9",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- This App Router root layout loads fonts globally, not on a single page. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&family=Parisienne&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
