'use client';

import Link from 'next/link';
// import { ConnectWallet } from '@coinbase/onchainkit/wallet';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <section className="py-12 md:py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          Welcome to <span className="text-blue-600">CarP2P</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mb-10">
          The first decentralized marketplace for vehicle ownership. Tokenize your car, 
          trade it seamlessly, or use it as collateral for loans.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/marketplace" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Browse Marketplace
          </Link>
          <Link href="/cars" className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
            Tokenize Your Car
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Tokenize</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Convert your vehicle into a digital asset. Add details, upload photos, and create an NFT 
            representing your cars ownership.
          </p>
          <Link href="/cars" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Get Started →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Trade</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Buy and sell vehicles as NFTs. Transparent history, secure transactions, and instant transfers 
            of ownership without paperwork.
          </p>
          <Link href="/marketplace" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            View Marketplace →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Collateralize</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Use your tokenized vehicles as collateral to get loans. Access liquidity without selling 
            your valuable assets.
          </p>
          <Link href="/collateralize" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Explore Loans →
          </Link>
        </div>
      </section>
    </div>
  );
}