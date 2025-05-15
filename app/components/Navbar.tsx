'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { useVehicleNFTV2 } from '@/app/hooks/useVehicleNFTV2';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { isContractOwner } = useVehicleNFTV2();
  const [isOwner, setIsOwner] = useState(false);
  
  // Check if the user is the contract owner on mount and when connection changes
  useEffect(() => {
    if (isConnected) {
      setIsOwner(isContractOwner());
    } else {
      setIsOwner(false);
    }
  }, [isConnected, isContractOwner]);
  
  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-gray-300';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            CarP2P
          </Link>
          
          {/* Display admin badge if user is contract owner */}
          {isOwner && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Admin
            </span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex space-x-6">
            <Link href="/profile" className={`${isActive('/profile')} hover:text-blue-600 transition-colors`}>
              Profile
            </Link>
            <Link href="/cars" className={`${isActive('/cars')} hover:text-blue-600 transition-colors`}>
              My Cars
            </Link>
            <Link href="/trading" className={`${isActive('/trading')} hover:text-blue-600 transition-colors`}>
              CarP2P Trading
            </Link>
            <Link href="/collateralize" className={`${isActive('/collateralize')} hover:text-blue-600 transition-colors`}>
              Get Loans
            </Link>
            
            {/* Admin link - only visible to contract owner */}
            {isOwner && (
              <Link 
                href="/admin/owner" 
                className={`${isActive('/admin/owner')} hover:text-blue-600 transition-colors relative group`}
              >
                Admin
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
              </Link>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </nav>
  );
} 