'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import Image from 'next/image';

type Car = {
  id: string;
  title: string;
  image: string;
  price: string;
  seller?: string; // Allow undefined
  tokenId: string;
  yearModel: string;
  brand: string;
  model: string;
  kilometers: string;
  location: string;
  isMine: boolean;
  purchasedBy?: string; // Opcional si no siempre está presente
};

export default function TradingPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-listings', 'purchased'
  
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
            title: 'Toyota Corolla 2022',
            image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dttps://images.unsplash.com/photo-1612563893490-d86ed296e5e6?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            price: '1.5',
            seller: '0x1234...5678',
            tokenId: '#1',
            yearModel: '2022',
            brand: 'Toyota',
            model: 'Corolla',
            kilometers: '15,000',
            location: 'Bogotá, Colombia',
            isMine: false
          },
          {
            id: '2',
            title: 'Chevrolet Camaro 2020',
            image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
            price: '2.8',
            seller: address || '', // Ensure seller is always a string
            tokenId: '#2',
            yearModel: '2020',
            brand: 'Chevrolet',
            model: 'Camaro',
            kilometers: '20,000',
            location: 'Medellín, Colombia',
            isMine: true
          },
          {
            id: '3',
            title: 'Mazda CX-5 2021',
            image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537',
            price: '1.8',
            seller: '0x9876...4321',
            tokenId: '#3',
            yearModel: '2021',
            brand: 'Mazda',
            model: 'CX-5',
            kilometers: '18,000',
            location: 'Cali, Colombia', 
            isMine: false
          },
          {
            id: '4',
            title: 'Ford Mustang 2019',
            image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8',
            price: '2.2',
            seller: address, // Current user's address
            tokenId: '#4',
            yearModel: '2019',
            brand: 'Ford',
            model: 'Mustang',
            kilometers: '25,000',
            location: 'Barranquilla, Colombia',
            isMine: true
          },
          {
            id: '5',
            title: 'Volkswagen Golf 2021',
            image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
            price: '1.3',
            seller: '0xabcd...efgh', // Ensure this is always a string
            tokenId: '#5',
            yearModel: '2021',
            brand: 'Volkswagen',
            model: 'Golf',
            kilometers: '12,000',
            location: 'Cartagena, Colombia',
            isMine: false
          },
          {
            id: '6',
            title: 'Honda Civic 2023',
            image: 'https://images.unsplash.com/photo-1607853554439-0069ec0f29b6',
            price: '2.1',
            seller: '0x7890...1234', // Ensure this is always a string
            tokenId: '#6',
            yearModel: '2023',
            brand: 'Honda',
            model: 'Civic',
            kilometers: '5,000',
            location: 'Bogotá, Colombia',
            isMine: false
          }
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

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
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
    <div className="max-w-7xl mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">CarP2P Trading</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Listings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Browse Vehicle Listings</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Find tokenized vehicles for sale on the marketplace.
            </p>
          </div>
          <div className="p-5">
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>View all available vehicle NFTs for sale</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Secure escrow-protected transactions</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Pay with BCOP tokens (6 decimals)</span>
              </li>
            </ul>
          </div>
          <div className="p-5 bg-gray-50 dark:bg-gray-700">
            <Link 
              href="/trading/listings" 
              className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
            >
              Browse Listings
            </Link>
          </div>
        </div>
        
        {/* My Orders Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage My Orders</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track your active escrows, purchases, and sales.
            </p>
          </div>
          <div className="p-5">
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>View your created listings</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Sign and complete escrow transactions</span>
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Track purchases and sales history</span>
              </li>
            </ul>
          </div>
          <div className="p-5 bg-gray-50 dark:bg-gray-700">
            <Link 
              href="/trading/orders" 
              className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
      
      {/* Create Listing Button */}
      <div className="mt-8 text-center">
        <Link 
          href="/cars" 
          className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition-colors"
        >
          Sell My Vehicle
        </Link>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Select one of your tokenized vehicles to list for sale
        </p>
      </div>
    </div>
  );
}