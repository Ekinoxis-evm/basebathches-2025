'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import Link from 'next/link';
import { useVehicleNFTV2 } from '../../../app/hooks/useVehicleNFTV2';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isContractOwner, contractAddress, ownerAddress } = useVehicleNFTV2();
  const [isOwner, setIsOwner] = useState(false);
  
  // Stats (mock data for now)
  const [stats, setStats] = useState({
    totalMinted: 0,
    authorizedMinters: 0,
    activeListings: 0,
    totalTrades: 0
  });
  
  // Check if the connected wallet is the contract owner
  useEffect(() => {
    if (isConnected) {
      setIsOwner(isContractOwner());
    } else {
      setIsOwner(false);
    }
    
    // Mock data - in a real app, these would be fetched from the blockchain
    setStats({
      totalMinted: 12,
      authorizedMinters: 3,
      activeListings: 2,
      totalTrades: 5
    });
  }, [isConnected, isContractOwner]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to access the admin panel</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }
  
  if (!isOwner) {
    return (
      <div className="max-w-7xl mx-auto mt-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">Access Restricted</p>
            <p>This admin area is only accessible to the contract owner.</p>
          </div>
          
          <div className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">Your address: <span className="font-mono">{address}</span></p>
            <p className="mb-4">Owner address: <span className="font-mono">{ownerAddress}</span></p>
            <p>Please connect with the contract owner wallet to access admin features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      </div>
      
      {/* Admin verification badge */}
      <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
        <p className="font-bold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          Verified Contract Owner
        </p>
        <p>You have full administrative privileges.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Total NFTs Minted</h2>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMinted}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Authorized Minters</h2>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.authorizedMinters}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Active Listings</h2>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeListings}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Total Trades</h2>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalTrades}</p>
        </div>
      </div>
      
      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          href="/admin/owner" 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage minters and permissions</p>
          <div className="flex justify-end">
            <span className="flex items-center text-blue-600 dark:text-blue-400">
              View 
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </span>
          </div>
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Contract Details</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-medium">Address:</span>{" "}
            <a 
              href={`https://sepolia.basescan.org/address/${contractAddress}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {contractAddress}
            </a>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Network:</span> Base Sepolia Testnet
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Admin Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
              <span>Authorize New Minter</span>
            </button>
            <button className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors">
              Pause Transactions
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Activity (mockup) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">NFT Minted</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">0x1a2b...3c4d</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">2 hours ago</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Minter Authorized</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">0x5e6f...7g8h</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">1 day ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 