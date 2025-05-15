import { useEffect, useState } from 'react';
import { useEscrow, EscrowState, EscrowData } from '@/app/hooks/useEscrow';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface NFTEscrowProps {
  escrowId: string;
  nftMetadata?: {
    name: string;
    image: string;
    description: string;
  };
  onStateChange?: (newState: EscrowState) => void;
}

export function NFTEscrow({ escrowId, nftMetadata, onStateChange }: NFTEscrowProps) {
  const { address } = useAccount();
  const { escrowData, isLoading, error, assignAsBuyer, depositPayment, signEscrow, refetchEscrowDetails } = useEscrow(escrowId);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchEscrowDetails();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [refetchEscrowDetails]);

  useEffect(() => {
    if (escrowData && onStateChange) {
      onStateChange(escrowData.state);
    }
  }, [escrowData, onStateChange]);

  // Format price from wei to display value (6 decimals for BCOP)
  const formatPrice = (priceWei: string) => {
    return (Number(priceWei) / 1_000_000).toFixed(2);
  };

  // Get the status text based on escrow state
  const getStatusText = (escrow: EscrowData) => {
    switch (escrow.state) {
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
  };

  const handleAssignAsBuyer = async () => {
    if (!address) {
      toast({
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
        toast({
          title: 'Success!',
          description: 'You are now the buyer for this vehicle.',
        });
        refetchEscrowDetails();
      } else {
        toast({
          title: 'Failed to assign as buyer',
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error assigning as buyer:', err);
      toast({
        title: 'Error',
        description: 'Failed to assign as buyer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepositPayment = async () => {
    setActionLoading(true);
    try {
      const result = await depositPayment(escrowId);
      if (result) {
        toast({
          title: 'Payment Deposited!',
          description: 'Your payment has been deposited to the escrow.',
        });
        refetchEscrowDetails();
      } else {
        toast({
          title: 'Failed to deposit payment',
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error depositing payment:', err);
      toast({
        title: 'Error',
        description: 'Failed to deposit payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignEscrow = async (accept: boolean) => {
    setActionLoading(true);
    try {
      const result = await signEscrow(escrowId, accept);
      if (result) {
        toast({
          title: accept ? 'Escrow Signed!' : 'Escrow Rejected',
          description: accept
            ? 'You have signed the escrow agreement.'
            : 'You have rejected the escrow agreement.',
        });
        refetchEscrowDetails();
      } else {
        toast({
          title: `Failed to ${accept ? 'sign' : 'reject'} escrow`,
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error signing escrow:', err);
      toast({
        title: 'Error',
        description: `Failed to ${accept ? 'sign' : 'reject'} escrow. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !escrowData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load escrow information</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{error || 'Could not load escrow details'}</p>
        </CardContent>
      </Card>
    );
  }

  // Check if current user is the seller or buyer
  const isSeller = address && escrowData.seller.toLowerCase() === address.toLowerCase();
  const isBuyer = address && escrowData.buyer && escrowData.buyer.toLowerCase() === address.toLowerCase();
  const isNoBuyer = !escrowData.buyer || escrowData.buyer === '0x0000000000000000000000000000000000000000';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{nftMetadata?.name || `Vehicle #${escrowData.tokenId}`}</CardTitle>
        <CardDescription>
          Escrow Status: {getStatusText(escrowData)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {nftMetadata?.image && (
            <img
              src={nftMetadata.image}
              alt={nftMetadata.name || `Vehicle ${escrowData.tokenId}`}
              className="w-full rounded-md object-cover h-48"
            />
          )}

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
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {/* Buyer can assign themselves if no buyer yet */}
        {escrowData.state === EscrowState.Created && isNoBuyer && !isSeller && (
          <Button
            className="w-full"
            onClick={handleAssignAsBuyer}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Become Buyer
          </Button>
        )}

        {/* Buyer can deposit payment */}
        {escrowData.state === EscrowState.Created && isBuyer && (
          <Button
            className="w-full"
            onClick={handleDepositPayment}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Deposit Payment
          </Button>
        )}

        {/* Signing options for buyer and seller */}
        {escrowData.state === EscrowState.BuyerDeposited && (isSeller || isBuyer) && (
          <div className="flex w-full gap-2">
            {/* Show sign button if user hasn't signed yet */}
            {(isSeller && !escrowData.sellerSigned) || (isBuyer && !escrowData.buyerSigned) ? (
              <Button
                className="flex-1"
                onClick={() => handleSignEscrow(true)}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept Deal
              </Button>
            ) : (
              <Button className="flex-1" disabled>
                Accepted ✓
              </Button>
            )}
            
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => handleSignEscrow(false)}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel Deal
            </Button>
          </div>
        )}

        {/* Completed or Cancelled state */}
        {(escrowData.state === EscrowState.Completed || escrowData.state === EscrowState.Cancelled) && (
          <div className="w-full text-center py-2 font-semibold">
            {escrowData.state === EscrowState.Completed ? 'Transaction Complete' : 'Transaction Cancelled'}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 