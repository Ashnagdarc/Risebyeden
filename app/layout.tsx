import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--sans-font',
  weight: ['300', '500', '700']
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--mono-font',
  weight: ['400', '500']
});

export const metadata: Metadata = {
  title: "Obsidian Portfolio",
  description: "Minimal dark theme property investment portfolio dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
