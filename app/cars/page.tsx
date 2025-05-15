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
  const { isConnected, address } = useAccount();
  const { userNFTs, isLoading, error } = useUserNFTs();
  // Use client-side rendering to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);
  
  // Add state to toggle between real and sample data
  const [useSampleData, setUseSampleData] = useState(false);
  
  // Determine which vehicles to display - use sample data if user chooses to 
  // or if there's an error and no cars are found
  const displayVehicles = useSampleData || (error && userNFTs.length === 0) 
    ? SAMPLE_VEHICLES 
    : userNFTs;
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleCardClick = (id: string) => {
    router.push(`/cars/${id}`);
  };

  const handleTokenize = () => {
    router.push('/cars/tokenize');
  };
  
  // Toggle between real and sample data
  const toggleDataSource = () => {
    setUseSampleData(!useSampleData);
  };
  
  // Show loading state during initial client-side render
  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Vehicles</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Vehicles</h1>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Vehicles</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleTokenize}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Tokenize New Vehicle
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg text-red-500 mb-4">Error loading vehicles</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={toggleDataSource}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors mb-4"
          >
            Show Sample Vehicles
          </button>
          {useSampleData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {SAMPLE_VEHICLES.map(car => (
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
            </div>
          )}
        </div>
      ) : displayVehicles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-4">You don&apos;t have any tokenized vehicles yet</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            Tokenize your first vehicle to get started with CarP2P.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleTokenize}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Tokenize Your First Vehicle
            </button>
            <button
              onClick={toggleDataSource}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors"
            >
              View Sample Vehicles
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p>Click on any vehicle to view detailed information and manage it.</p>
              </div>
              {useSampleData && (
                <div className="text-amber-600 text-sm flex items-center">
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-medium">
                    Showing Sample Data
                  </span>
                  <button
                    onClick={toggleDataSource}
                    className="ml-3 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    View Blockchain Data
                  </button>
                </div>
              )}
            </div>
          </div>

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
          </div>
        </>
      )}
    </div>
  );
}