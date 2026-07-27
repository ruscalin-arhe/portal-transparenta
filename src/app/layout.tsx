import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Public de Transparență – Coridorul Verde-Digital",
  description: "Portal public de transparență pentru proiecte, progres și date financiare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={geistSans.variable + " " + geistMono.variable + " antialiased"}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
