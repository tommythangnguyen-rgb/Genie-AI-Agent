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
  title: "askGenie | Student Aid HUB — AI Financial Aid Expert",
  description:
    "AI-powered financial aid expert built by a 15-year FA professional. Instant guidance on FAFSA, Title IV, R2T4 calculations, SAP policies, FSA audits, and 34 CFR compliance — for students, parents, administrators, leaders, and auditors.",
  keywords: [
    "financial aid AI",
    "FAFSA help",
    "R2T4 calculator",
    "Title IV compliance",
    "SAP policy",
    "FSA audit",
    "student aid",
    "34 CFR",
    "financial aid administrator",
    "NSLDS",
    "Direct Loans",
    "askGenie",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "shortcut icon" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [{ rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "askGenie",
    statusBarStyle: "black-translucent",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "askGenie | Student Aid HUB — AI Financial Aid Expert",
    description:
      "Instant AI guidance on FAFSA, Title IV, R2T4, FSA audits, and more. Built by a 15-year financial aid professional for students, parents & FA offices.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://genie127.com",
    siteName: "askGenie",
  },
  twitter: {
    card: "summary_large_image",
    title: "askGenie | Student Aid HUB",
    description:
      "AI-powered financial aid companion for students, parents, FA administrators, leaders & auditors. Covers FAFSA, Title IV, R2T4, 34 CFR, SAP, and more.",
  },
  robots: {
    index: true,
    follow: true,
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
