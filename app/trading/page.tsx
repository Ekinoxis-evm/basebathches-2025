'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import dynamic from 'next/dynamic';
import { SellNFTForm } from '../components/SellNFTForm';
import Dialog from '../components/Dialog';

// Import ConnectWallet dynamically with SSR disabled to prevent hydration errors
const DynamicConnectWallet = dynamic(
  () => import('@coinbase/onchainkit/wallet').then(mod => mod.ConnectWallet),
  { ssr: false }
);

// Define Car type explicitly
type Car = {
  id: string;
  title: string;
  image: string;
  price: string;
  seller: string;
  tokenId: string;
  yearModel: string;
  brand: string;
  model: string;
  kilometers: string;
  location: string;
  isMine: boolean;
  purchasedBy?: string;
};

export default function TradingPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('listings'); // 'listings' or 'orders'
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<Car | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        
        // This would be replaced with actual API calls to your backend or blockchain
        // For now, use mock data and cast it to the Car[] type
        const mockCars: Car[] = [
          {
            id: '1',
            title: 'Toyota Corolla 2022',
            image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75',
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
            title: 'Ford Ranger 2020',
            image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5',
            price: '2.0',
            seller: address ? String(address) : '',
            tokenId: '#2',
            yearModel: '2020',
            brand: 'Ford',
            model: 'Ranger',
            kilometers: '30,000',
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
            seller: address ? String(address) : '',
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
        console.error('Failed to fetch cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [address]);

  // Open the sell dialog when 'Sell My Vehicle' is clicked
  const handleSellClick = (nft = null) => {
    setSelectedNFT(nft);
    setIsSellDialogOpen(true);
  };

  // Handle successful listing creation
  const handleSellSuccess = (escrowId: string) => {
    setIsSellDialogOpen(false);
    // Refresh the car listings
    router.refresh();
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">CarP2P Trading</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view trading</h2>
          <div className="flex justify-center">
            <DynamicConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CarP2P Trading</h1>
        
        {/* "Sell My Vehicle" button in top right */}
        <button
          onClick={() => handleSellClick()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Sell My Vehicle
        </button>
      </div>

      {/* Two column layout for features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Vehicle Listings Feature Box */}
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer transition-all ${selectedTab === 'listings' ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}
          onClick={() => setSelectedTab('listings')}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Vehicle Listings</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Find tokenized vehicles for sale on the marketplace.
          </p>
          <ul className="text-gray-600 dark:text-gray-300 ml-5 list-disc space-y-2">
            <li>View all available vehicle NFTs for sale</li>
            <li>Secure escrow-protected transactions</li>
            <li>Pay with BCOP tokens (6 decimals)</li>
          </ul>
        </div>

        {/* My Orders Feature Box */}
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer transition-all ${selectedTab === 'orders' ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`} 
          onClick={() => setSelectedTab('orders')}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">My Orders</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Manage and track your active escrows, purchases, and sales.
          </p>
          <ul className="text-gray-600 dark:text-gray-300 ml-5 list-disc space-y-2">
            <li>View your created listings</li>
            <li>Sign and complete escrow transactions</li>
            <li>Track purchases and sales history</li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedTab('listings')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedTab === 'listings'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Available Vehicles
            </button>
            <button
              onClick={() => setSelectedTab('orders')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                selectedTab === 'orders'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              My Orders
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {selectedTab === 'listings' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                      Available Vehicles
                    </h3>
                    
                    {cars.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No vehicles found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {cars.filter(car => !car.isMine).map((car) => (
                          <div key={car.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative aspect-video overflow-hidden">
                              <Image 
                                src={car.image} 
                                alt={car.title}
                                width={400}
                                height={225}
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute top-0 right-0 m-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                                Token {car.tokenId}
                              </div>
                            </div>
                            <div className="p-4">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {car.title}
                              </h4>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600 dark:text-gray-400 text-sm">
                                  {car.brand} {car.model} {car.yearModel}
                                </span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                  {car.price} BCOP
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                <div>
                                  <span className="font-medium">Kilometers:</span> {car.kilometers}
                                </div>
                                <div>
                                  <span className="font-medium">Location:</span> {car.location}
                                </div>
                              </div>
                              <Link 
                                href={`/cars/${car.id}`}
                                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedTab === 'orders' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">
                      My Active Listings
                    </h3>
                    
                    {cars.filter(car => car.isMine).length === 0 ? (
                      <div className="text-center py-8 mb-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any active listings</p>
                        <button
                          onClick={() => handleSellClick()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Create a Listing
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 mb-12">
                        {cars.filter(car => car.isMine).map((car) => (
                          <div 
                            key={car.id} 
                            className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
                              <div className="w-16 h-16 md:w-20 md:h-20 relative mr-4 mb-2 md:mb-0">
                                <Image 
                                  src={car.image} 
                                  alt={car.title}
                                  width={80}
                                  height={80}
                                  className="object-cover w-full h-full rounded"
                                />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {car.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Token {car.tokenId} · Listed for {car.price} BCOP
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link 
                                href={`/cars/${car.id}`}
                                className="px-3 py-1 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                              >
                                View
                              </Link>
                              <button
                                className="px-3 py-1 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded hover:bg-red-50 dark:hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">
                      Purchase History
                    </h3>
                    
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">No purchase history yet</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Sell NFT Dialog */}
      <Dialog
        isOpen={isSellDialogOpen}
        onClose={() => setIsSellDialogOpen(false)}
        title="Sell Your Vehicle"
      >
        <SellNFTForm
          tokenId={selectedNFT?.tokenId || ''}
          tokenName={selectedNFT?.title || ''}
          tokenImage={selectedNFT?.image || ''}
          onSuccess={handleSellSuccess}
        />
      </Dialog>
    </div>
  );
}