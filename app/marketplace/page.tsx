'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import Image from 'next/image'; // Import the Image component


// Mock marketplace data
const mockListings = [
  {
    id: '101',
    title: 'Tesla Model 3 2023',
    type: 'Electric Sedan',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1470&auto=format&fit=crop',
    tokenId: '234567',
    price: 42000,
    seller: '0x1234...5678',
    condition: 'New',
    mileage: 2500,
    location: 'Los Angeles, CA'
  },
  {
    id: '102',
    title: 'Ford F-150 2022',
    type: 'Pickup Truck',
    imageUrl: 'https://images.unsplash.com/photo-1571986929789-95307bbfa7c2?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tokenId: '345678',
    price: 38500,
    seller: '0xabcd...ef01',
    condition: 'Used',
    mileage: 15000,
    location: 'Austin, TX'
  },
  {
    id: '103',
    title: 'BMW X5 2021',
    type: 'Luxury SUV',
    imageUrl: 'https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?q=80&w=1470&auto=format&fit=crop',
    tokenId: '456789',
    price: 58000,
    seller: '0x2345...6789',
    condition: 'Used',
    mileage: 22000,
    location: 'Miami, FL'
  },
  {
    id: '104',
    title: 'Chevrolet Bolt 2023',
    type: 'Electric Hatchback',
    imageUrl: 'https://images.unsplash.com/photo-1697989716939-1a53494e1f7b?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tokenId: '567890',
    price: 27500,
    seller: '0x3456...7890',
    condition: 'New',
    mileage: 500,
    location: 'Seattle, WA'
  }
];

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  // Filter listings based on search term and filters
  const filteredListings = mockListings.filter(listing => {
    // Search term filter
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        listing.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Price filter
    let matchesPrice = true;
    if (priceFilter === 'under30k') matchesPrice = listing.price < 30000;
    else if (priceFilter === '30k-50k') matchesPrice = listing.price >= 30000 && listing.price <= 50000;
    else if (priceFilter === 'over50k') matchesPrice = listing.price > 50000;
    
    // Type filter
    let matchesType = true;
    if (typeFilter !== 'all') matchesType = listing.type.toLowerCase().includes(typeFilter.toLowerCase());
    
    return matchesSearch && matchesPrice && matchesType;
  });

  const handlePurchase = async (listingId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet to purchase');
      return;
    }
    
    setSelectedListing(listingId);
    setPurchaseStatus('processing');
    
    try {
      // Here would be the actual purchase logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPurchaseStatus('success');
    } catch (error) {
      setPurchaseStatus('error');
      console.error(error);
    }
  };

  if (purchaseStatus === 'success' && selectedListing) {
    const purchasedListing = mockListings.find(listing => listing.id === selectedListing);
    
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Purchase Successful</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">Transaction Complete!</p>
            <p>You have successfully purchased {purchasedListing?.title}. The NFT has been transferred to your wallet.</p>
          </div>
          
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
            <div className="w-20 h-20 mr-4 overflow-hidden rounded relative">
                {purchasedListing?.imageUrl ? (
                  <Image
                    src={purchasedListing.imageUrl}
                    alt={purchasedListing?.title || "Listing thumbnail"}
                    fill={true}
                    className="object-cover"
                    sizes="80px" // 20*4=80px (since Tailwind uses rem units)
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200"></div> // Placeholder if no image
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{purchasedListing?.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Token ID: {purchasedListing?.tokenId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">${purchasedListing?.price.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4 items-center">
            <Link href="/cars" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              View My Cars
            </Link>
            <Link href="/marketplace" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={() => setPurchaseStatus(null)}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Marketplace</h1>
        
        {!isConnected && (
          <ConnectWallet />
        )}
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search by make, model, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Prices</option>
              <option value="under30k">Under $30,000</option>
              <option value="30k-50k">$30,000 - $50,000</option>
              <option value="over50k">Over $50,000</option>
            </select>
          </div>
          
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="truck">Truck</option>
              <option value="electric">Electric</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Listings */}
      {filteredListings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">No cars found matching your criteria</h2>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="h-48 w-full overflow-hidden">
                <Image 
                  src={listing.imageUrl} 
                  alt={listing.title} 
                  className="w-full h-full object-cover"
                  width={500} // Set appropriate width
                  height={200} // Set appropriate height
                  layout="responsive" // Maintain aspect ratio
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{listing.title}</h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 dark:text-gray-300">{listing.type}</span>
                  <span className="text-gray-900 dark:text-white font-medium">${listing.price.toLocaleString()}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Condition:</span> {listing.condition}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Mileage:</span> {listing.mileage.toLocaleString()} miles
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Location:</span> {listing.location}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Token ID:</span> {listing.tokenId}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <Link href={`/marketplace/details/${listing.id}`} className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                    View Details
                  </Link>
                  <button
                    onClick={() => handlePurchase(listing.id)}
                    disabled={purchaseStatus === 'processing' && selectedListing === listing.id}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:bg-gray-400"
                  >
                    {purchaseStatus === 'processing' && selectedListing === listing.id ? 'Processing...' : 'Purchase'}
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