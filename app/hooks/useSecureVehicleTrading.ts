import { useState, useCallback } from 'react';
import { useVehicleListing, FullListingDetails, ListingStatus } from './useVehicleListing';
import { useSignatureEscrow, TransactionType, EscrowDetails } from './useSignatureEscrow';
import { useAccount } from 'wagmi';

// Trading role enum
export enum TradingRole {
  None,
  Seller,
  Buyer,
  Arbiter
}

// Escrow state constants
export enum EscrowState {
  Created = 0,
  BuyerDeposited = 1,
  ReadyForExecution = 2,
  Completed = 3,
  Cancelled = 4
}

// Combined trading details
export interface TradingDetails {
  listingDetails: FullListingDetails | null;
  escrowDetails: EscrowDetails | null;
  userRole: TradingRole;
  canApproveCompleteEscrow: boolean;
  canApproveCancelEscrow: boolean;
  canDepositPayment: boolean;
  canAssignAsBuyer: boolean;
  requiresMoreSignatures: boolean;
  currentSignatureCount: number;
  requiredSignatureCount: number;
  isLoadingTransaction: boolean;
}

// Custom hook for secure vehicle trading
export function useSecureVehicleTrading() {
  const { address } = useAccount();
  const vehicleListing = useVehicleListing();
  const signatureEscrow = useSignatureEscrow();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determine user's role in the trading process
  const determineUserRole = useCallback(
    (listingDetails: FullListingDetails | null, escrowDetails: EscrowDetails | null): TradingRole => {
      if (!address || !listingDetails || !escrowDetails) return TradingRole.None;

      if (listingDetails.listing.owner.toLowerCase() === address.toLowerCase()) {
        return TradingRole.Seller;
      } else if (escrowDetails.buyer.toLowerCase() === address.toLowerCase()) {
        return TradingRole.Buyer;
      } else if (escrowDetails.arbiter.toLowerCase() === address.toLowerCase()) {
        return TradingRole.Arbiter;
      }

      return TradingRole.None;
    },
    [address]
  );

  // Get full trading details
  const getTradingDetails = useCallback(
    async (listingId: bigint): Promise<TradingDetails | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Get listing details
        const listingDetails = await vehicleListing.getFullListingDetails(listingId);
        if (!listingDetails) {
          throw new Error('Failed to fetch listing details');
        }

        // If no escrow has been created, return early
        if (listingDetails.listing.status !== ListingStatus.InEscrow || listingDetails.listing.escrowId === 0n) {
          return {
            listingDetails,
            escrowDetails: null,
            userRole: TradingRole.None,
            canApproveCompleteEscrow: false,
            canApproveCancelEscrow: false,
            canDepositPayment: false,
            canAssignAsBuyer: false,
            requiresMoreSignatures: false,
            currentSignatureCount: 0,
            requiredSignatureCount: 0,
            isLoadingTransaction: isLoading || signatureEscrow.isLoading
          };
        }

        // Get escrow details
        const escrowDetails = await signatureEscrow.getEscrowDetails(listingDetails.listing.escrowId);
        if (!escrowDetails) {
          throw new Error('Failed to fetch escrow details');
        }

        // Determine user role
        const userRole = determineUserRole(listingDetails, escrowDetails);

        // Calculate signature requirements
        const requiredSignatureCount = escrowDetails.threshold;
        // Note: We would need to get the current approval count from a separate API endpoint
        // since the contract doesn't directly expose this through a view function
        const currentSignatureCount = 0; // This should be fetched from API
        const requiresMoreSignatures = currentSignatureCount < requiredSignatureCount;

        // Determine user permissions
        const canApproveCompleteEscrow =
          escrowDetails.state === EscrowState.BuyerDeposited &&
          ((userRole === TradingRole.Seller && escrowDetails.requireSeller) ||
           (userRole === TradingRole.Buyer && escrowDetails.requireBuyer) ||
           (userRole === TradingRole.Arbiter && escrowDetails.requireArbiter));

        const canApproveCancelEscrow = canApproveCompleteEscrow;

        const canDepositPayment =
          userRole === TradingRole.Buyer &&
          escrowDetails.state === EscrowState.Created;

        const canAssignAsBuyer =
          userRole === TradingRole.None &&
          address !== null &&
          address !== undefined &&
          address !== escrowDetails.seller &&
          escrowDetails.buyer === '0x0000000000000000000000000000000000000000' &&
          escrowDetails.state === EscrowState.Created;

        return {
          listingDetails,
          escrowDetails,
          userRole,
          canApproveCompleteEscrow,
          canApproveCancelEscrow,
          canDepositPayment,
          canAssignAsBuyer,
          requiresMoreSignatures,
          currentSignatureCount,
          requiredSignatureCount,
          isLoadingTransaction: isLoading || signatureEscrow.isLoading
        };
      } catch (err) {
        console.error('Error fetching trading details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [vehicleListing, signatureEscrow, determineUserRole, isLoading]
  );

  // Create a vehicle listing and prepare it for sale
  const listVehicleForSale = useCallback(
    async (
      nftContract: string,
      tokenId: bigint,
      price: string,
      metadataURI: string,
      useArbiter: boolean = false,
      arbiter: string = '0x0000000000000000000000000000000000000000',
      expirationDays: number = 0
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Create the listing
        vehicleListing.createVehicleListing(nftContract, tokenId, price, metadataURI);

        // Note: In a real implementation, you would wait for the transaction to complete
        // and get the new listing ID. Here, we're simplifying for brevity.
        
        // Pretend we got the listing ID
        const listingId = (vehicleListing.currentListingId || 0n) + 1n;

        // Step 2: Create the appropriate escrow
        if (useArbiter && arbiter !== '0x0000000000000000000000000000000000000000') {
          vehicleListing.createEscrowWithArbiter(
            listingId,
            arbiter,
            true, // requireBuyer
            true, // requireSeller
            true, // requireArbiter
            2,    // threshold (2 of 3 signatures)
            expirationDays
          );
        } else {
          vehicleListing.createStandardEscrow(listingId);
        }

        return {
          success: true,
          listingId
        };
      } catch (err) {
        console.error('Error listing vehicle for sale:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        return {
          success: false,
          error: err
        };
      } finally {
        setIsLoading(false);
      }
    },
    [vehicleListing]
  );

  // Participate in a vehicle purchase as a buyer
  const participateAsBuyer = useCallback(
    async (escrowId: bigint) => {
      try {
        setIsLoading(true);
        setError(null);

        // Assign self as buyer
        signatureEscrow.assignAsBuyer({ args: [escrowId] });

        return { success: true };
      } catch (err) {
        console.error('Error participating as buyer:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        return {
          success: false,
          error: err
        };
      } finally {
        setIsLoading(false);
      }
    },
    [signatureEscrow]
  );

  // Make payment for a vehicle
  const makePayment = useCallback(
    async (escrowId: bigint) => {
      try {
        setIsLoading(true);
        setError(null);

        // Deposit payment
        signatureEscrow.depositPayment({ args: [escrowId] });

        return { success: true };
      } catch (err) {
        console.error('Error making payment:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        return {
          success: false,
          error: err
        };
      } finally {
        setIsLoading(false);
      }
    },
    [signatureEscrow]
  );

  // Approve transaction (on-chain)
  const approveTransaction = useCallback(
    async (escrowId: bigint, txType: TransactionType) => {
      try {
        setIsLoading(true);
        setError(null);

        signatureEscrow.approveTransaction({ args: [escrowId, txType] });

        return { success: true };
      } catch (err) {
        console.error('Error approving transaction:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        return {
          success: false,
          error: err
        };
      } finally {
        setIsLoading(false);
      }
    },
    [signatureEscrow]
  );

  // Sign transaction (off-chain)
  const signTransaction = useCallback(
    async (escrowId: bigint, txType: TransactionType) => {
      if (!address) {
        setError('Wallet not connected');
        return { success: false, error: 'Wallet not connected' };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await signatureEscrow.submitSignature(escrowId, txType, address);

        return result;
      } catch (err) {
        console.error('Error signing transaction:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        return {
          success: false,
          error: err
        };
      } finally {
        setIsLoading(false);
      }
    },
    [address, signatureEscrow]
  );

  return {
    isLoading: isLoading || vehicleListing.isLoading || signatureEscrow.isLoading,
    error,
    getTradingDetails,
    listVehicleForSale,
    participateAsBuyer,
    makePayment,
    approveTransaction,
    signTransaction,
    updateVehicleLocation: vehicleListing.updateVehicleLocation,
    updateVehicleDocuments: vehicleListing.updateVehicleDocuments,
  };
} 