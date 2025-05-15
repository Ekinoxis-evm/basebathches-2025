'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';

// Import ConnectWallet dynamically with SSR disabled to prevent hydration errors
const ConnectWallet = dynamic(
  () => import('@coinbase/onchainkit/wallet').then(mod => mod.ConnectWallet),
  { ssr: false }
);

type CarActionLayoutProps = {
  title: string;
  children: ReactNode;
  showBackLink?: boolean;
  showWalletInfo?: boolean;
};

export default function CarActionLayout({
  title,
  children,
  showBackLink = true,
  showWalletInfo = false
}: CarActionLayoutProps) {
  const { isConnected, address } = useAccount();
  // Use client-side rendering to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render wallet-dependent content until client-side
  if (!isMounted) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{title}</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{title}</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to continue</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        {showBackLink && (
          <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Cars
          </Link>
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
      
      {/* Main content */}
      {children}
      
      {/* Optional wallet info */}
      {showWalletInfo && address && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Connected Wallet</h2>
          <p className="text-gray-700 dark:text-gray-300 break-all">
            <span className="font-medium">Address:</span> {address}
          </p>
        </div>
      )}
    </div>
  );
} 