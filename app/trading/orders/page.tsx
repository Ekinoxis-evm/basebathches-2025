'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEscrow, EscrowState, EscrowData } from '@/app/hooks/useEscrow';
import { formatUnits } from 'viem';
import Link from 'next/link';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';

export default function OrdersPage() {
  const [myOrders, setMyOrders] = useState<EscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { fetchEscrowDetails } = useEscrow();

  useEffect(() => {
    async function fetchOrders() {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);

        // For demo purposes, we'll fetch the last 10 escrow IDs
        // In a real application, you'd want to implement pagination and filters
        const maxEscrowsToFetch = 10;
        const orders: EscrowData[] = [];

        // Fetch the escrows one by one
        for (let i = 1; i <= maxEscrowsToFetch; i++) {
          try {
            const escrow = await fetchEscrowDetails(i.toString());
            // Only include escrows where the current user is either the seller or buyer
            if (escrow && 
                (escrow.seller.toLowerCase() === address.toLowerCase() || 
                 escrow.buyer.toLowerCase() === address.toLowerCase())) {
              orders.push(escrow);
            }
          } catch (err) {
            console.error(`Error fetching escrow ${i}:`, err);
            // Continue with next escrow
          }
        }

        setMyOrders(orders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [fetchEscrowDetails, address, isConnected]);

  // Format price from wei to display value (6 decimals for BCOP)
  const formatPrice = (priceWei: string) => {
    try {
      return formatUnits(BigInt(priceWei), 6);
    } catch (e) {
      console.error("Error formatting price:", e);
      return "0.00";
    }
  };

  // Helper to get badge color by escrow state
  const getStateBadgeColor = (state: EscrowState) => {
    switch (state) {
      case EscrowState.Created:
        return "bg-blue-100 text-blue-800";
      case EscrowState.BuyerDeposited:
        return "bg-yellow-100 text-yellow-800";
      case EscrowState.Accepted:
        return "bg-purple-100 text-purple-800";
      case EscrowState.Completed:
        return "bg-green-100 text-green-800";
      case EscrowState.Cancelled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper to get human-readable state name
  const getStateLabel = (state: EscrowState) => {
    switch (state) {
      case EscrowState.Created:
        return "Created";
      case EscrowState.BuyerDeposited:
        return "Payment Deposited";
      case EscrowState.Accepted:
        return "Accepted";
      case EscrowState.Completed:
        return "Completed";
      case EscrowState.Cancelled:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  // Determine if user is seller, buyer, or both in the escrow
  const getUserRole = (escrow: EscrowData, userAddress: string) => {
    if (escrow.seller.toLowerCase() === userAddress.toLowerCase()) {
      return "Seller";
    } else if (escrow.buyer.toLowerCase() === userAddress.toLowerCase()) {
      return "Buyer";
    }
    return "Unknown";
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Trading Orders</h1>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">Please connect your wallet to view your orders</p>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Trading Orders</h1>
        <Link href="/trading" className="text-blue-600 hover:underline">
          ← Back to Trading
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : myOrders.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-md text-center">
          <p className="text-gray-600 mb-4">You don't have any active orders.</p>
          <Link 
            href="/trading/listings" 
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b flex flex-wrap justify-between items-center">
                <div>
                  <span className="font-medium">Escrow #{order.id} - </span>
                  <span>Vehicle #{order.tokenId}</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStateBadgeColor(order.state)}`}>
                      {getStateLabel(order.state)}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      You are the {getUserRole(order, address || '')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium">
                    {formatPrice(order.price)} BCOP
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Seller:</span>
                    <span className="text-sm truncate max-w-[200px]">
                      {order.seller.slice(0, 6)}...{order.seller.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Buyer:</span>
                    <span className="text-sm truncate max-w-[200px]">
                      {order.buyer ? `${order.buyer.slice(0, 6)}...${order.buyer.slice(-4)}` : 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Seller Signed:</span>
                    <span className="text-sm">{order.sellerSigned ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Buyer Signed:</span>
                    <span className="text-sm">{order.buyerSigned ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                <Link 
                  href={`/trading/escrow/${order.id}`}
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