import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Speak - Privacy-First Decentralized Social Media',
  description: 'Own your data, control your privacy. A Web3 social platform built on blockchain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen bg-background">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
