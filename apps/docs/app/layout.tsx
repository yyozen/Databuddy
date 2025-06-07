import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Databuddy } from '@databuddy/sdk';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <Databuddy
        clientId="EH70Yyf_C8E1yRDqBkI-k"
        trackErrors={true}
      />
      <body className="flex flex-col min-h-screen">
        <RootProvider >
            <Navbar />
            {children}
        </RootProvider>
      </body>
    </html>
  );
}
