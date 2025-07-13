import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Databuddy Admin",
  description: "Admin dashboard for Databuddy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <Script src="http://localhost:3000/databuddy.js" data-api-url="http://localhost:4001" strategy="afterInteractive" data-client-id="KLeXlL5zrgyV6P9IlqyL3" data-track-screen-views="true" data-track-performance="true" data-track-errors="true" />
      <body className={`${geist.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
