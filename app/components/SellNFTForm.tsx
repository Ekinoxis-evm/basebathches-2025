import { useState, useCallback } from 'react';
import { useEscrow } from '@/app/hooks/useEscrow';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';

type NFTSaleStatus = 'initial' | 'approval' | 'listing' | 'success' | 'error';

interface ToastMessage {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface SellNFTFormProps {
  tokenId: string;
  tokenName: string;
  tokenImage: string;
  onSuccess?: (escrowId: string) => void;
}

export function SellNFTForm({ tokenId, tokenName, tokenImage, onSuccess }: SellNFTFormProps) {
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleStatus, setSaleStatus] = useState<NFTSaleStatus>('initial');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const { createEscrow, isLoading, error } = useEscrow();
  const { address } = useAccount();
  
  // Fixed token decimals for BCOP on Base
  const tokenDecimals = 6; // BCOP on Base uses 6 decimals
  
  // Clear toast after delay
  const showToast = useCallback((message: ToastMessage) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  }, []);

  async function handleSell() {
    if (!price || parseFloat(price) <= 0) {
      showToast({
        title: 'Invalid price',
        description: 'Please enter a valid price greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setSaleStatus('approval');

    try {
      // Convert price to blockchain format with proper decimals
      // BCOP uses 6 decimals, so 1 BCOP = 1000000 units
      const priceValue = parseFloat(price);
      const priceInWei = parseUnits(price, tokenDecimals).toString();
      
      console.log(`Selling NFT with token ID ${tokenId} for ${priceValue} BCOP (${priceInWei} wei)`);
      
      // Create escrow for the NFT
      const result = await createEscrow(tokenId, priceInWei);
      
      if (result) {
        setSaleStatus('success');
        showToast({
          title: 'Success!',
          description: 'Your vehicle has been listed for sale',
          variant: 'success',
        });
        
        if (onSuccess) {
          // Extract escrow ID from result
          const escrowId = typeof result === 'string' ? result : '1';
          onSuccess(escrowId);
        }
      } else {
        setSaleStatus('error');
        showToast({
          title: 'Failed to list vehicle',
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error listing vehicle for sale:', err);
      setSaleStatus('error');
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to list your vehicle. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      // Return to initial state after delay
      setTimeout(() => setSaleStatus('initial'), 2000);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium">Sell Your Vehicle</h3>
        <p className="text-sm text-gray-500">
          List your vehicle NFT for sale on the CarP2P marketplace
        </p>
      </div>
      
      <div className="px-6 py-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img 
              src={tokenImage} 
              alt={tokenName} 
              className="rounded-md object-cover w-20 h-20" 
            />
            <div>
              <h3 className="font-medium">{tokenName}</h3>
              <p className="text-sm text-gray-500">Token ID: {tokenId}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (BCOP)
            </label>
            <div className="flex items-center">
              <input
                id="price"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitting}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the price in BCOP tokens ({tokenDecimals} decimals)
            </p>
          </div>
        </div>
      </div>
      
      {toast && (
        <div className={`px-6 py-3 mb-4 ${toast.variant === 'destructive' ? 'bg-red-100 text-red-700' : toast.variant === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} rounded-md`}>
          <p className="font-bold">{toast.title}</p>
          <p className="text-sm">{toast.description}</p>
        </div>
      )}
      
      <div className="px-6 py-4 bg-gray-50">
        <button
          className={`w-full px-4 py-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            saleStatus === 'success' 
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : saleStatus === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={handleSell}
          disabled={isSubmitting || isLoading || !price || parseFloat(price) <= 0}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {saleStatus === 'approval' ? 'Approving...' : 'Creating Listing...'}
            </span>
          ) : saleStatus === 'success' ? (
            'Listed Successfully!'
          ) : saleStatus === 'error' ? (
            'Failed to List'
          ) : (
            'List for Sale'
          )}
        </button>
      </div>
    </div>
  );
} 