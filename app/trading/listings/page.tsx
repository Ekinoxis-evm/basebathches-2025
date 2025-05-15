'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEscrow, EscrowState, EscrowData } from '@/app/hooks/useEscrow';
import { formatUnits } from 'viem';
import Link from 'next/link';

// Listings page component
export default function ListingsPage() {
  const [listings, setListings] = useState<EscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { fetchEscrowDetails } = useEscrow();

  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true);
        setError(null);

        // For demo purposes, we'll fetch the last 10 escrow IDs
        // In a real application, you'd want to implement pagination and filters
        const maxEscrowsToFetch = 10;
        const listings: EscrowData[] = [];

        // Fetch the escrows one by one
        // A better approach would be to have a backend API that returns all escrows
        for (let i = 1; i <= maxEscrowsToFetch; i++) {
          try {
            const escrow = await fetchEscrowDetails(i.toString());
            if (escrow && escrow.state === EscrowState.Created) {
              listings.push(escrow);
            }
          } catch (err) {
            console.error(`Error fetching escrow ${i}:`, err);
            // Continue with next escrow
          }
        }

        setListings(listings);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [fetchEscrowDetails]);

  // Format price from wei to display value (6 decimals for BCOP)
  const formatPrice = (priceWei: string) => {
    try {
      return formatUnits(BigInt(priceWei), 6);
    } catch (e) {
      console.error("Error formatting price:", e);
      return "0.00";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vehicle Listings</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-md text-center">
          <p className="text-gray-600">No vehicle listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Vehicle #{listing.tokenId}</h3>
                <p className="text-sm text-gray-500">
                  Price: {formatPrice(listing.price)} BCOP
                </p>
              </div>
              
              <div className="p-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Seller:</span>
                    <span className="text-sm truncate max-w-[200px]">
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Token ID:</span>
                    <span className="text-sm">{listing.tokenId}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                <Link 
                  href={`/trading/escrow/${listing.id}`}
                  className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 