'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import NFTCard from '@/app/components/NFTCard';
import { useUserNFTs } from '@/app/hooks/useUserNFTs';
import { CONTRACT_ADDRESSES } from '@/app/contracts/config';

// Import ConnectWallet dynamically with SSR disabled to prevent hydration errors
const ConnectWallet = dynamic(
  () => import('@coinbase/onchainkit/wallet').then(mod => mod.ConnectWallet),
  { ssr: false }
);

// Sample vehicles for testing when blockchain data isn't available
const SAMPLE_VEHICLES = [
  {
    id: '1',
    tokenId: '1',
    title: 'Toyota Corolla 2022',
    description: 'A well-maintained Toyota Corolla with low mileage and all service records.',
    image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    status: 'Owned',
    placa: 'ABC123',
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2
  },
  {
    id: '2',
    tokenId: '2',
    title: 'Ford Mustang 2021',
    description: 'Powerful Ford Mustang with V8 engine and premium sound system.',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    status: 'Owned',
    placa: 'XYZ789',
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2
  },
  {
    id: '3',
    tokenId: '3',
    title: 'Honda Civic 2023',
    description: 'Fuel-efficient Honda Civic in excellent condition with new tires.',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    status: 'Owned',
    placa: 'DEF456',
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2
  },
  {
    id: '4',
    tokenId: '4',
    title: 'Chevrolet Camaro 2020',
    description: 'Sports car with automatic transmission and premium interior.',
    image: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    status: 'Owned',
    placa: 'GHI789',
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2
  },
  {
    id: '5',
    tokenId: '5',
    title: 'Tesla Model 3 2023',
    description: 'All-electric Tesla with autopilot and zero emissions.',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    status: 'Owned',
    placa: 'JKL012',
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2
  }
];

export default function CarsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { userNFTs, isLoading } = useUserNFTs();
  const [isMounted, setIsMounted] = useState(false);
  
  // Use real NFTs if available, otherwise show sample data
  const displayVehicles = userNFTs && userNFTs.length > 0 ? userNFTs : SAMPLE_VEHICLES;
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTokenize = () => {
    router.push('/cars/tokenize');
  };
  
  if (!isMounted) {
    return null; // Avoid hydration errors
  }
  
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Vehicle NFTs</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view your vehicles</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Vehicle NFTs</h1>
          <p className="text-gray-600 mt-1">
            View and manage the NFT tokens for vehicles that you own
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/trading"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
          >
            <span>Trading Platform</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <button
            onClick={handleTokenize}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Tokenize New Vehicle
          </button>
        </div>
      </div>

      <div className="p-4 mb-6 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-800">About Vehicle NFTs</h3>
            <div className="mt-2 text-sm text-indigo-700">
              <p>
                This page displays the actual <strong>NFT tokens</strong> that you own, showing the complete vehicle information and images.
              </p>
              <p className="mt-1">
                To buy or sell vehicles through escrow contracts, visit the <Link href="/trading" className="underline">Trading Platform</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVehicles.map(car => (
            <NFTCard
              key={car.id}
              title={car.title}
              tokenId={car.tokenId}
              description={car.description}
              imageUrl={car.image}
              placa={car.placa}
              contractAddress={car.contractAddress}
              href={`/cars/${car.tokenId}`}
            />
          ))}
          
          {userNFTs && userNFTs.length === 0 && !isLoading && (
            <div className="col-span-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No NFT vehicles found in your wallet. The sample vehicles shown are for demonstration only.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                For newly minted tokens, they will appear automatically in your inventory.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}