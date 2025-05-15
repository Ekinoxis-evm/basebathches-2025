import { useEffect, useState, useCallback, useMemo } from 'react';
import { useEscrow, EscrowState, EscrowData } from '@/app/hooks/useEscrow';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';

interface NFTMetadata {
  name: string;
  image: string;
  description: string;
}

interface NFTEscrowProps {
  escrowId: string;
  nftMetadata?: NFTMetadata;
  onStateChange?: (newState: EscrowState) => void;
}

interface ToastMessage {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function NFTEscrow({ escrowId, nftMetadata, onStateChange }: NFTEscrowProps) {
  const { address } = useAccount();
  const { 
    escrowData, 
    isLoading, 
    error, 
    assignAsBuyer, 
    depositPayment, 
    signEscrow, 
    refetchEscrowDetails 
  } = useEscrow(escrowId);

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Auto-refresh escrow data
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchEscrowDetails();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [refetchEscrowDetails]);

  // Notify parent component of state changes
  useEffect(() => {
    if (escrowData && onStateChange) {
      onStateChange(escrowData.state);
    }
  }, [escrowData, onStateChange]);

  // Toast display with auto-dismiss
  const showToast = useCallback((message: ToastMessage) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Format price from wei to display value (6 decimals for BCOP)
  const formatPrice = useCallback((priceWei: string) => {
    try {
      return formatUnits(BigInt(priceWei), 6);
    } catch (e) {
      console.error("Error formatting price:", e);
      return "0.00";
    }
  }, []);

  // Get the status text based on escrow state
  const statusText = useMemo(() => {
    if (!escrowData) return 'Loading...';
    
    switch (escrowData.state) {
      case EscrowState.Created:
        return 'Available for Purchase';
      case EscrowState.BuyerDeposited:
        return 'Awaiting Signatures';
      case EscrowState.Accepted:
        return 'Escrow Accepted';
      case EscrowState.Completed:
        return 'Sale Completed';
      case EscrowState.Cancelled:
        return 'Sale Cancelled';
      default:
        return 'Unknown State';
    }
  }, [escrowData]);

  // Memoized role relationships
  const { isSeller, isBuyer, isNoBuyer } = useMemo(() => {
    if (!escrowData || !address) {
      return { isSeller: false, isBuyer: false, isNoBuyer: true };
    }
    
    const isSeller = escrowData.seller.toLowerCase() === address.toLowerCase();
    const isBuyer = escrowData.buyer && escrowData.buyer.toLowerCase() === address.toLowerCase();
    const isNoBuyer = !escrowData.buyer || escrowData.buyer === '0x0000000000000000000000000000000000000000';
    
    return { isSeller, isBuyer, isNoBuyer };
  }, [escrowData, address]);

  // Handler for becoming a buyer
  const handleAssignAsBuyer = async () => {
    if (!address) {
      showToast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to purchase this vehicle',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const result = await assignAsBuyer(escrowId);
      if (result) {
        showToast({
          title: 'Success!',
          description: 'You are now the buyer for this vehicle.',
          variant: 'success',
        });
        refetchEscrowDetails();
      } else {
        showToast({
          title: 'Failed to assign as buyer',
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error assigning as buyer:', err);
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to assign as buyer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for depositing payment
  const handleDepositPayment = async () => {
    setActionLoading(true);
    try {
      const result = await depositPayment(escrowId);
      if (result) {
        showToast({
          title: 'Payment Deposited!',
          description: 'Your payment has been deposited to the escrow.',
          variant: 'success',
        });
        refetchEscrowDetails();
      } else {
        showToast({
          title: 'Failed to deposit payment',
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error depositing payment:', err);
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to deposit payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for signing escrow
  const handleSignEscrow = async (accept: boolean) => {
    setActionLoading(true);
    try {
      const result = await signEscrow(escrowId, accept);
      if (result) {
        showToast({
          title: accept ? 'Escrow Signed!' : 'Escrow Rejected',
          description: accept
            ? 'You have signed the escrow agreement.'
            : 'You have rejected the escrow agreement.',
          variant: accept ? 'success' : 'default',
        });
        refetchEscrowDetails();
      } else {
        showToast({
          title: `Failed to ${accept ? 'sign' : 'reject'} escrow`,
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error signing escrow:', err);
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${accept ? 'sign' : 'reject'} escrow. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error || !escrowData) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Error</h3>
          <p className="text-sm text-gray-500">Failed to load escrow information</p>
        </div>
        <div className="px-6 py-4">
          <p>{error || 'Could not load escrow details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Toast notification */}
      {toast && (
        <div className={`px-6 py-3 ${
          toast.variant === 'destructive' 
            ? 'bg-red-100 text-red-700' 
            : toast.variant === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
        }`}>
          <p className="font-bold">{toast.title}</p>
          <p className="text-sm">{toast.description}</p>
        </div>
      )}
      
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium">{nftMetadata?.name || `Vehicle #${escrowData.tokenId}`}</h3>
        <p className="text-sm text-gray-500">
          Escrow Status: {statusText}
        </p>
      </div>
      
      <div className="px-6 py-4">
        <div className="space-y-4">
          {/* NFT Image */}
          {nftMetadata?.image && (
            <img
              src={nftMetadata.image}
              alt={nftMetadata.name || `Vehicle ${escrowData.tokenId}`}
              className="w-full rounded-md object-cover h-48"
            />
          )}

          {/* Escrow details */}
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Token ID:</span>
              <span className="text-sm">{escrowData.tokenId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Price:</span>
              <span className="text-sm font-bold">{formatPrice(escrowData.price)} BCOP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Seller:</span>
              <span className="text-sm truncate max-w-[200px]">{escrowData.seller}</span>
            </div>
            {escrowData.buyer && escrowData.buyer !== '0x0000000000000000000000000000000000000000' && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Buyer:</span>
                <span className="text-sm truncate max-w-[200px]">{escrowData.buyer}</span>
              </div>
            )}
            {escrowData.state >= EscrowState.BuyerDeposited && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Signatures:</span>
                <span className="text-sm">
                  Seller: {escrowData.sellerSigned ? '✓' : '✗'} | 
                  Buyer: {escrowData.buyerSigned ? '✓' : '✗'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 flex flex-col gap-2">
        {/* Action buttons based on escrow state and user role */}
        {escrowData.state === EscrowState.Created && isNoBuyer && !isSeller && (
          <button
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            onClick={handleAssignAsBuyer}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Become Buyer'}
          </button>
        )}

        {/* Buyer can deposit payment */}
        {escrowData.state === EscrowState.Created && isBuyer && (
          <button
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            onClick={handleDepositPayment}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Deposit Payment'}
          </button>
        )}

        {/* Signing options for buyer and seller */}
        {escrowData.state === EscrowState.BuyerDeposited && (isSeller || isBuyer) && (
          <div className="flex w-full gap-2">
            {/* Show sign button if user hasn't signed yet */}
            {(isSeller && !escrowData.sellerSigned) || (isBuyer && !escrowData.buyerSigned) ? (
              <button
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                onClick={() => handleSignEscrow(true)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Accept Deal'}
              </button>
            ) : (
              <button 
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md cursor-not-allowed" 
                disabled
              >
                Accepted ✓
              </button>
            )}
            
            <button
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
              onClick={() => handleSignEscrow(false)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Cancel Deal'}
            </button>
          </div>
        )}

        {/* Completed or Cancelled state */}
        {(escrowData.state === EscrowState.Completed || escrowData.state === EscrowState.Cancelled) && (
          <div className="w-full text-center py-2 font-semibold">
            {escrowData.state === EscrowState.Completed ? 'Transaction Complete' : 'Transaction Cancelled'}
          </div>
        )}
      </div>
    </div>
  );
} 