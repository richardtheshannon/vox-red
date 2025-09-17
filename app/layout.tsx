import type { Metadata } from "next";
import { Unica_One, Crimson_Text } from "next/font/google";
import "./globals.css";
import SessionProvider from './components/providers/SessionProvider';
import ConditionalThemeToggle from './components/ConditionalThemeToggle';
import AdminSettingsIcon from './components/AdminSettingsIcon';
import HomeIcon from './components/HomeIcon';

const unicaOne = Unica_One({
  weight: '400',
  variable: "--font-unica-one",
  subsets: ["latin"],
});

const crimsonText = Crimson_Text({
  weight: ['400', '600', '700'],
  variable: "--font-crimson-text",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VOX RED",
  description: "A modern CMS with slider interface",
  manifest: "/manifest.json",
  icons: {
    icon: "/media/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VOX RED",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "VOX RED",
    description: "A modern CMS with slider interface",
    siteName: "VOX RED",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f9fafb" media="(prefers-color-scheme: light)" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${unicaOne.variable} ${crimsonText.variable} antialiased`}
      >
        <SessionProvider>
          <ConditionalThemeToggle />
          <AdminSettingsIcon />
          <HomeIcon />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
