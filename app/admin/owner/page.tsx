'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import Link from 'next/link';
import { useVehicleNFTV2 } from '../../../../app/hooks/useVehicleNFTV2';

export default function OwnerAdminPage() {
  const { address, isConnected } = useAccount();
  const { 
    authorizeMinter, 
    isContractOwner, 
    isLoading, 
    transactionHash, 
    transactionUrl,
    ownerAddress,
    contractAddress
  } = useVehicleNFTV2();
  
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [isOwner, setIsOwner] = useState(false);

  // Check if the connected wallet is the contract owner
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      setIsOwner(isContractOwner());
    } else {
      setIsOwner(false);
    }
  }, [address, isContractOwner]);

  // Form for authorizing minters
  const [minterAddress, setMinterAddress] = useState('');
  const [authorizing, setAuthorizing] = useState(false);
  const [authorizationError, setAuthorizationError] = useState<string | null>(null);
  const [authorizationSuccess, setAuthorizationSuccess] = useState(false);

  // Authorization form handler
  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!minterAddress || !minterAddress.startsWith('0x')) {
      alert('Please enter a valid Ethereum address');
      return;
    }
    
    setAuthorizing(true);
    setAuthorizationError(null);
    setAuthorizationSuccess(false);
    
    try {
      console.log(`Authorizing minter: ${minterAddress}`);
      
      // Call the contract function to authorize a minter
      await authorizeMinter(minterAddress as `0x${string}`);
      
      setAuthorizationSuccess(true);
      setMinterAddress(''); // Clear the input field
    } catch (error) {
      console.error('Error authorizing minter:', error);
      if (error instanceof Error) {
        setAuthorizationError(error.message);
      } else {
        setAuthorizationError('An unknown error occurred while authorizing the minter.');
      }
    } finally {
      setAuthorizing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Contract Owner Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Please connect your wallet</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contract Owner Dashboard</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Wallet Status</h2>
        
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Your address:</span> {walletAddress}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Owner address:</span> {ownerAddress}
          </p>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            <span className="font-medium">Status:</span> 
            {isOwner ? (
              <span className="text-green-600 dark:text-green-400"> You are the contract owner ✓</span>
            ) : (
              <span className="text-red-600 dark:text-red-400"> You are NOT the contract owner ✗</span>
            )}
          </p>
        </div>
        
        {isOwner ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Authorize Minter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add an address to the list of authorized minters who can mint NFTs without being the contract owner.
            </p>
            
            <form onSubmit={handleAuthorize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Wallet Address to Authorize
                </label>
                <input
                  type="text"
                  value={minterAddress}
                  onChange={(e) => setMinterAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={authorizing || isLoading}
                className={`px-4 py-2 ${
                  authorizing || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium rounded-lg transition-colors flex items-center justify-center`}
              >
                {authorizing || isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authorizing...
                  </>
                ) : (
                  'Authorize Address'
                )}
              </button>
            </form>
            
            {authorizationSuccess && transactionHash && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">
                <p className="font-medium">Address Authorized Successfully!</p>
                <a
                  href={transactionUrl || `https://sepolia.basescan.org/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all block mt-2 text-sm"
                >
                  View Transaction: {transactionHash}
                </a>
              </div>
            )}
            
            {authorizationError && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
                <p className="font-medium">Error Authorizing Address</p>
                <p className="mt-1 text-sm">{authorizationError}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 rounded">
            <p className="font-medium">You need to connect with the contract owner wallet to manage contract settings.</p>
            <p className="mt-2">
              Please connect with: {ownerAddress}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Contract Information</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          <span className="font-medium">Contract Address:</span>{" "}
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
    </div>
  );
} 