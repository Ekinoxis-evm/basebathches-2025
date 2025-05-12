'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';

export default function TradingPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [cars, setCars] = useState<any[]>([]);
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
            image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
            seller: address, // Current user's address
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
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to My Cars
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CarP2P Trading</h1>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setActiveTab('my-listings')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'my-listings'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'purchased'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Purchased
          </button>
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
              You don't have any cars listed for sale. Go to your cars and click "Sell" to list one.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map(car => (
            <div key={car.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={car.image}
                  alt={car.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                  {car.price} ETH
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{car.title}</h3>
                
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Token ID:</span> {car.tokenId}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Year:</span> {car.yearModel}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Model:</span> {car.brand} {car.model}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Kilometers:</span> {car.kilometers}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Location:</span> {car.location}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    href={`/cars/${car.id}`}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-center text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                  
                  {car.isMine ? (
                    <button
                      onClick={() => handleRemoveListing(car.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(car.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Buy Now
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