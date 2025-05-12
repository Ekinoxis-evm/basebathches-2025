import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Navbar from './components/Navbar';

export const metadata: Metadata = {
  title: 'CarP2P - Tokenize and Trade Vehicles',
  description: 'Tokenize your vehicles, trade them as NFTs, and use them as collateral for loans',
  icons: {
    icon: '../public/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
