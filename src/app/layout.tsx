import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eventhub.community"),
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
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventHub",
    description: "Plan Events. Invite Friends. Share Memories.",
  },
  other: {
    "fb:app_id": "123456789012345",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" prefix="og: http://ogp.me/ns#">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
