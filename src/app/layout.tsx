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
  title: "Portal Public de Transparență",
  description:
    "Portal de informare publică privind proiectele de interes public, progresul, datele financiare și sesizările cetățenilor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body
        className={
          geistSans.variable + " " + geistMono.variable + " antialiased"
        }
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
