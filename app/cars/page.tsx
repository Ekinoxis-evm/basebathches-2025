'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';

export default function CarsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [cars, setCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user's cars
  useEffect(() => {
    const fetchCars = async () => {
      if (!isConnected) return;
      
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock car data
        const mockCars = [
          {
            id: '1',
            title: 'Toyota Corolla 2022',
            image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            status: 'Tokenized',
            tokenId: '#1',
            placa: 'ABC123',
          },
          {
            id: '2',
            title: 'Chevrolet Camaro 2020',
            image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
            status: 'Listed for Sale',
            tokenId: '#2',
            placa: 'XYZ789',
            price: '2.8',
          },
        ];
        
        setCars(mockCars);
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCars();
  }, [isConnected]);
  
  const handleCardClick = (id: string) => {
    router.push(`/cars/${id}`);
  };
  
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Cars</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view your cars</h2>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Cars</h1>
        <div className="flex space-x-3">
          <Link
            href="/cars/tokenize"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Tokenize New Car
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : cars.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-4">You don't have any cars yet</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            Tokenize your car to get started with CarP2P.
          </p>
          <Link
            href="/cars/tokenize"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Tokenize Your First Car
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <div 
              key={car.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(car.id)}
            >
              <div className="relative">
                <img
                  src={car.image}
                  alt={car.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                  {car.status}
                </div>
                {car.price && (
                  <div className="absolute bottom-0 right-0 bg-green-600 text-white px-3 py-1 text-sm font-semibold">
                    {car.price} ETH
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{car.title}</h3>
                <div className="mb-2 space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Token ID:</span> {car.tokenId}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Plate:</span> {car.placa}
                  </p>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 