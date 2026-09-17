import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertiCell | Battery intelligence",
  description: "Independent health assessments, traceable testing, and verification for second-life batteries.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
