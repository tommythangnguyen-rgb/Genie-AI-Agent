import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "askGenie | Financial Aid Hub",
  description:
    "AI-powered financial aid companion for students, parents, and financial aid administrators. Expert guidance on FAFSA, Title IV, R2T4, verification, and more.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "askGenie | Financial Aid Hub",
    description:
      "AI-powered financial aid companion. Expert guidance on FAFSA, Title IV, R2T4, and more.",
    type: "website",
    url: "https://uigen-dusky-eight.vercel.app",
  },
  twitter: {
    card: "summary",
    title: "askGenie | Financial Aid Hub",
    description:
      "AI-powered financial aid companion for students, parents, and administrators.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
