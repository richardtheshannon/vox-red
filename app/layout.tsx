import type { Metadata } from "next";
import { Unica_One, Roboto } from "next/font/google";
import "./globals.css";
import SessionProvider from './components/providers/SessionProvider';
import ConditionalThemeToggle from './components/ConditionalThemeToggle';
import AdminSettingsIcon from './components/AdminSettingsIcon';
import HomeIcon from './components/HomeIcon';
import { AutoPlayProvider } from './components/AutoPlayManager';
import AutoPlayIcon from './components/AutoPlayManager';

const unicaOne = Unica_One({
  weight: '400',
  variable: "--font-unica-one",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  variable: "--font-roboto",
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
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f9fafb" media="(prefers-color-scheme: light)" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${unicaOne.variable} ${roboto.variable} antialiased`}
      >
        <SessionProvider>
          <AutoPlayProvider>
            <ConditionalThemeToggle />
            <AdminSettingsIcon />
            <HomeIcon />
            <AutoPlayIcon />
            {children}
          </AutoPlayProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
