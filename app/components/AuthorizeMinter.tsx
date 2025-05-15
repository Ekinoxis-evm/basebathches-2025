'use client';

import { useState } from 'react';
import { useVehicleNFTV2 } from '../../../app/hooks/useVehicleNFTV2';

export default function AuthorizeMinter() {
  const [minterAddress, setMinterAddress] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { authorizeMinter, transactionUrl } = useVehicleNFTV2();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!minterAddress || !minterAddress.startsWith('0x') || minterAddress.length !== 42) {
      setStatus('error');
      setErrorMessage('Please enter a valid Ethereum address');
      return;
    }
    
    try {
      setStatus('loading');
      setErrorMessage('');
      
      console.log('Authorizing minter:', {
        minterAddress,
        contractAddress: '0x1C4cc777E309c6403Ce82e2332887470773A8a74'
      });
      
      await authorizeMinter(minterAddress as `0x${string}`);
      setStatus('success');
      console.log('Authorization successful!');
    } catch (error) {
      console.error('Error authorizing minter:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Authorize Minter</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minter Address
          </label>
          <input 
            type="text" 
            value={minterAddress}
            onChange={(e) => setMinterAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={status === 'loading'}
          className={`px-4 py-2 ${
            status === 'loading' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium rounded-lg transition-colors`}
        >
          {status === 'loading' ? 'Authorizing...' : 'Authorize Address'}
        </button>
      </form>
      
      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">
          <p className="font-medium">Successfully authorized minter!</p>
          {transactionUrl && (
            <a 
              href={transactionUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all block mt-2 text-sm"
            >
              View transaction
            </a>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          <p className="font-medium">Error: {errorMessage}</p>
        </div>
      )}
    </div>
  );
} 