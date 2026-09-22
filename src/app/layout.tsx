import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GARDIN Cosmetics — Coming Soon",
  description: "Gourmand body care for skin worth indulging.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
