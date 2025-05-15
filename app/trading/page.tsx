"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import Image from 'next/image';
import { readContract } from '@wagmi/core';
import { config } from '@/app/config/wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from '../../contracts/config';
import { NFTEscrow } from '@/app/components/NFTEscrow';
import { EscrowState } from '@/app/hooks/useEscrow';

// Define a Car type that represents the structure of a car object
interface Car {
  purchasedBy: string | undefined;
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  linea: string;
  color: string;
  tokenId?: string; // Optional if not all cars have tokenId
  tokenized?: boolean;
  imageUrl?: string;
  isMine?: boolean; // Indicates if the car belongs to the current user
  brand: string; // Add the brand property
  price: string; // Add the price property
  yearModel: string; // Add the yearModel property
  kilometers: string; // Add the kilometers property
  location: string; // Add the location property
  // Add any other properties that your car objects have
}

// Sample NFT metadata for demonstration
const SAMPLE_METADATA = {
  1: {
    name: 'Toyota Corolla 2022',
    image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Low mileage family sedan in excellent condition'
  },
  2: {
    name: 'Chevrolet Camaro 2020',
    image: 'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Powerful sports car with V8 engine'
  }
};

// Simplified ABI for EscrowNFT contract
const ESCROW_ABI = [
  {
    inputs: [],
    name: 'getCurrentEscrowId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
];

export default function TradingPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [cars, setCars] = useState<Car[]>([]); // Updated type
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-listings', 'purchased'
  const [escrowIds, setEscrowIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [useSampleData, setUseSampleData] = useState(false);
  
  // Fetch cars for sale
  useEffect(() => {
    const fetchCars = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock car data
        const mockCars = [
          {
            id: '1',
            placa: 'ABC123',
            marca: 'Toyota',
            modelo: 'Corolla',
            linea: 'Sedan',
            color: 'White',
            tokenId: '#1',
            tokenized: true,
            imageUrl: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            price: '1.5',
            seller: '0x1234...5678',
            yearModel: '2022',
            brand: 'Toyota',
            model: 'Corolla',
            kilometers: '15,000',
            location: 'Bogotá, Colombia',
            isMine: false,
            purchasedBy: undefined
          },
          {
            id: '2',
            placa: 'DEF456',
            marca: 'Chevrolet',
            modelo: 'Camaro',
            linea: 'Coupe',
            color: 'Red',
            tokenId: '#2',
            tokenized: true,
            imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
            price: '2.8',
            seller: address, // Current user's address
            yearModel: '2020',
            brand: 'Chevrolet',
            model: 'Camaro',
            kilometers: '20,000',
            location: 'Medellín, Colombia',
            isMine: true,
            purchasedBy: undefined
          },
          {
            id: '3',
            placa: 'GHI789',
            marca: 'Mazda',
            modelo: 'CX-5',
            linea: 'SUV',
            color: 'Blue',
            tokenId: '#3',
            tokenized: true,
            imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537',
            price: '1.8',
            seller: '0x9876...4321',
            yearModel: '2021',
            brand: 'Mazda',
            model: 'CX-5',
            kilometers: '18,000',
            location: 'Cali, Colombia', 
            isMine: false,
            purchasedBy: undefined
          },
          {
            id: '4',
            placa: 'JKL012',
            marca: 'Ford',
            modelo: 'Mustang',
            linea: 'Convertible',
            color: 'Black',
            tokenId: '#4',
            tokenized: true,
            imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8',
            price: '2.2',
            seller: address, // Current user's address
            yearModel: '2019',
            brand: 'Ford',
            model: 'Mustang',
            kilometers: '25,000',
            location: 'Barranquilla, Colombia',
            isMine: true,
            purchasedBy: '0x1234...5678'
          },
        ];
        
        setCars(mockCars);
      } catch (error) {
        console.error('Error fetching cars for sale:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCars();
  }, [address]);
  
  // Filter cars based on active tab
  const filteredCars = cars.filter(car => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my-listings') return car.isMine;
    if (activeTab === 'purchased') return car.purchasedBy === address;
    return true;
  });
  
  // Handle car purchase
  const handleBuy = async (carId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet to purchase a car');
      return;
    }
    
    if (confirm('Are you sure you want to purchase this car?')) {
      try {
        // Simulate purchase process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Here would be the actual escrow contract interaction
        
        alert('Car purchased successfully!');
        
        // Update cars state - in a real app, you would refetch from the API
        setCars(prevCars => 
          prevCars.map(car => 
            car.id === carId 
              ? { ...car, purchasedBy: address, isMine: false }
              : car
          )
        );
        
        // Navigate to the purchased car details
        router.push(`/cars/${carId}`);
      } catch (error) {
        console.error('Error purchasing car:', error);
        alert('There was an error purchasing the car. Please try again.');
      }
    }
  };
  
  // Handle removing a listing
  const handleRemoveListing = async (carId: string) => {
    if (confirm('Are you sure you want to remove this listing?')) {
      try {
        // Simulate removing process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Here would be the actual contract interaction
        
        // Update cars state - in a real app, you would refetch from the API
        setCars(prevCars => prevCars.filter(car => car.id !== carId));
        
        alert('Listing removed successfully!');
      } catch (error) {
        console.error('Error removing listing:', error);
        alert('There was an error removing your listing. Please try again.');
      }
    }
  };

  useEffect(() => {
    async function fetchEscrows() {
      setIsLoading(true);
      
      try {
        // Temporarily use sample data for development
        if (useSampleData) {
          console.log('Using sample escrow data');
          setEscrowIds(['1', '2']);
          setIsLoading(false);
          return;
        }
        
        // Get the current escrow ID from the contract
        const result = await readContract(config, {
          address: CONTRACT_ADDRESSES.EscrowNFT as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'getCurrentEscrowId',
          chainId: baseSepolia.id,
        });
        
        const currentId = Number(result);
        console.log('Current escrow ID:', currentId);
        
        if (currentId > 0) {
          // Create an array of escrow IDs from 1 to currentId
          const ids = Array.from({ length: currentId }, (_, i) => (i + 1).toString());
          setEscrowIds(ids);
        } else {
          setEscrowIds([]);
        }
      } catch (err) {
        console.error('Error fetching escrows:', err);
        setError('Failed to load escrows. Using sample data instead.');
        
        // Fallback to sample data if there's an error
        setEscrowIds(['1', '2']);
        setUseSampleData(true);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEscrows();
  }, [useSampleData]);
  
  // Toggle between real and sample data
  const toggleSampleData = () => {
    setUseSampleData(!useSampleData);
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">CarP2P Trading</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view trading</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Vehicle Trading Marketplace</h1>
        <div>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 mr-2 rounded-md ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setActiveTab('my-listings')}
            className={`px-4 py-2 mr-2 rounded-md ${
              activeTab === 'my-listings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'purchased'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Purchased
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            {activeTab === 'all' && 'Available Vehicle Contracts'}
            {activeTab === 'my-listings' && 'My Listed Vehicles'}
            {activeTab === 'purchased' && 'Purchased Vehicles'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {activeTab === 'all' && 'These are vehicle escrow contracts available for purchase on the marketplace'}
            {activeTab === 'my-listings' && 'Vehicles you have listed for sale'}
            {activeTab === 'purchased' && 'Vehicles you have purchased'}
          </p>
        </div>
        
        {activeTab === 'my-listings' && (
          <Link href="/cars">
            <span className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
              List New Vehicle
            </span>
          </Link>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Vehicle Trading Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The listings below represent <strong>escrow contracts</strong> for vehicle purchases, not the NFT tokens themselves. 
                Each listing contains basic transaction parameters needed for the escrow process when a buyer deposits BCOP tokens.
              </p>
              <p className="mt-1">
                To see all your owned vehicle NFTs, visit the <Link href="/cars" className="underline">My Cars</Link> page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg text-gray-600 dark:text-gray-400">No vehicles found</h3>
          {activeTab === 'my-listings' && (
            <p className="mt-2 text-gray-500 dark:text-gray-500">
              You dont have any cars listed for sale. Go to your cars and click Sell to list one.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map(car => (
            <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{car.marca} {car.modelo}</h3>
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Token {car.tokenId}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{car.yearModel} • {car.placa}</p>
              </div>

              {/* Contract Details */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Contract Price:</span>
                  <span className="font-bold text-blue-600">{car.price} BCOP</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
                  <div>
                    <span className="font-medium">Kilometers:</span> {car.kilometers}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {car.location}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-2 mt-4">
                  <Link 
                    href={`/cars/${car.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                  
                  {car.isMine ? (
                    <button
                      onClick={() => handleRemoveListing(car.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(car.id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}