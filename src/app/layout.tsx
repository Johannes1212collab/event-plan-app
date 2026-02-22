import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import "./neo-brutalist.css"; // OVERRIDE THEME
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eventhub.community"),
  manifest: "/manifest.json",
  title: {
    default: "EventHub",
    template: "%s | EventHub",
  },
  description: "Plan Events. Invite Friends. Share Memories.",
  openGraph: {
    title: "EventHub",
    description: "The easiest way to organize gatherings and keep all your photos and chats in one place.",
    url: "https://www.eventhub.community",
    siteName: "EventHub",
    images: [
      {
        url: "https://www.eventhub.community/api/og",
        width: 1200,
        height: 630,
        alt: "EventHub",
        type: "image/png",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventHub",
    description: "Plan Events. Invite Friends. Share Memories.",
    images: [
      {
        url: "https://www.eventhub.community/api/og",
        width: 1200,
        height: 630,
        alt: "EventHub",
      }
    ],
  },
  other: {
    "fb:app_id": "123456789012345",
  }
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: http://ogp.me/ns#">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} antialiased`}
      >
        {children}
        <Toaster closeButton duration={4000} position="bottom-center" />
      </body>
    </html>
  );
}
