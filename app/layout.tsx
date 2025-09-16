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
  title: "CMS Template",
  description: "A modern CMS template with slider interface",
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
