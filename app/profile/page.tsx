'use client';

import { useAccount } from 'wagmi';
import { EthBalance, Avatar, /*Name,*/ Address } from '@coinbase/onchainkit/identity';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';

// ERC20 ABI for balance checking
const erc20ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  }
];

// Create a public client for reading from the blockchain
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  
  // BCOP token contract address
  const BCOP_CONTRACT = '0x34Fa1aED9f275451747f3e9B5377608cCF96A458';
  
  // State for BCOP balance
  const [bcopBalance, setBcopBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Mock user profile data - in a real app, this would be fetched from a database or blockchain
  const [userProfile, setUserProfile] = useState({
    fullName: 'William Martinez',
    identificationType: 'Cedula de ciudadania',
    identificationNumber: '1234567890',
    memberSince: 'May 2025'
  });
  
  // For edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({...userProfile});
  
  const identificationTypes = [
    'Cedula de ciudadania',
    'Cedula extranjeria',
    'NIT'
  ];
  
  // Fetch BCOP balance when wallet is connected
  useEffect(() => {
    const fetchBcopBalance = async () => {
      if (isConnected && address) {
        try {
          setIsLoadingBalance(true);
          
          // Get decimals first
          const decimals = await publicClient.readContract({
            address: BCOP_CONTRACT as `0x${string}`,
            abi: erc20ABI,
            functionName: 'decimals',
          });
          
          // Get balance
          const balance = await publicClient.readContract({
            address: BCOP_CONTRACT as `0x${string}`,
            abi: erc20ABI, 
            functionName: 'balanceOf',
            args: [address],
          });
          
          // Format with proper decimals
          const formattedBalance = formatUnits(balance as bigint, decimals as number);
          setBcopBalance(formattedBalance);
        } catch (error) {
          console.error('Error fetching BCOP balance:', error);
          setBcopBalance('Error');
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };
    
    fetchBcopBalance();
  }, [isConnected, address]);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setUserProfile(editedProfile);
    }
    setIsEditing(!isEditing);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Mock functions for charge and monetize
  const handleChargeBcop = () => {
    alert('Redirect to BCOP charging page');
    // Implement actual logic or redirect
  };
  
  const handleMonetizeBcop = () => {
    alert('Redirect to BCOP monetization page');
    // Implement actual logic or redirect
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Profile</h1>
      
      {!isConnected ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view your profile</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <button 
                onClick={handleEditToggle}
                className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex-shrink-0">
                <Avatar className="w-24 h-24 rounded-full" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userProfile.fullName}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  <Address />
                </p>
                
                {/* New Identity Fields */}
                <div className="mt-4 space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Complete Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={editedProfile.fullName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Identification Type
                        </label>
                        <select
                          name="identificationType"
                          value={editedProfile.identificationType}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {identificationTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Identification Number
                        </label>
                        <input
                          type="text"
                          name="identificationNumber"
                          value={editedProfile.identificationNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-40">Complete Name:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{userProfile.fullName}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-40">Identification Type:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{userProfile.identificationType}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-40">Identification Number:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{userProfile.identificationNumber}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Member since {userProfile.memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Wallet Balance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ETH Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  <EthBalance />
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">BCOP Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoadingBalance ? 'Loading...' : `${bcopBalance} BCOP`}
                </p>
                <div className="flex mt-2 space-x-2">
                  <button
                    onClick={handleChargeBcop}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Charge BCOP
                  </button>
                  <button
                    onClick={handleMonetizeBcop}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Monetize BCOP
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Car Tokenization</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">0.01 ETH</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">May 10, 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Loan Repayment</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">0.5 ETH</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">May 5, 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Completed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 