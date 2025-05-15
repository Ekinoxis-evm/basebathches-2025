import { useState, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { SIGNATURE_ESCROW_ABI, CONTRACT_ADDRESSES } from '../contracts/config';
import { signTypedData } from '@wagmi/core';
import { parseEther } from 'viem';

// Enum for transaction types
export enum TransactionType {
  CompleteEscrow = 0,
  CancelEscrow = 1
}

// Interface for escrow details
export interface EscrowDetails {
  seller: string;
  nftContract: string;
  tokenId: bigint;
  paymentToken: string;
  price: bigint;
  buyer: string;
  arbiter: string;
  state: number;
  requireBuyer: boolean;
  requireSeller: boolean;
  requireArbiter: boolean;
  threshold: number;
  expirationTime: bigint;
}

// Custom hook for interacting with the SignatureEscrow contract
export function useSignatureEscrow() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract read calls
  const { data: currentEscrowId } = useContractRead({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'getCurrentEscrowId',
  });

  // Get escrow details
  const getEscrowDetails = useCallback(async (escrowId: bigint): Promise<EscrowDetails | null> => {
    try {
      const result = await fetch(`/api/escrow/${escrowId}`);
      if (!result.ok) throw new Error('Failed to fetch escrow details');
      return await result.json();
    } catch (err) {
      console.error('Error fetching escrow details:', err);
      return null;
    }
  }, []);

  // Get user nonce
  const { data: userNonce } = useContractRead({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'getNonce',
    args: [address || '0x0000000000000000000000000000000000000000'],
  });

  // Create escrow
  const { data: createEscrowData, write: createEscrow } = useContractWrite({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'createEscrow',
  });

  const { isLoading: isCreateEscrowLoading } = useWaitForTransaction({
    hash: createEscrowData?.hash,
  });

  // Assign as buyer
  const { data: assignBuyerData, write: assignAsBuyer } = useContractWrite({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'assignAsBuyer',
  });

  const { isLoading: isAssignBuyerLoading } = useWaitForTransaction({
    hash: assignBuyerData?.hash,
  });

  // Deposit payment
  const { data: depositPaymentData, write: depositPayment } = useContractWrite({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'depositPayment',
  });

  const { isLoading: isDepositPaymentLoading } = useWaitForTransaction({
    hash: depositPaymentData?.hash,
  });

  // Assign arbiter
  const { data: assignArbiterData, write: assignArbiter } = useContractWrite({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'assignArbiter',
  });

  const { isLoading: isAssignArbiterLoading } = useWaitForTransaction({
    hash: assignArbiterData?.hash,
  });

  // Approve transaction (on-chain)
  const { data: approveTransactionData, write: approveTransaction } = useContractWrite({
    address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
    abi: SIGNATURE_ESCROW_ABI,
    functionName: 'approveTransaction',
  });

  const { isLoading: isApproveTransactionLoading } = useWaitForTransaction({
    hash: approveTransactionData?.hash,
  });

  // Submit signature (off-chain signature)
  const submitSignature = useCallback(async (
    escrowId: bigint,
    txType: TransactionType,
    signer: string,
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get transaction hash data
      const hashDataResponse = await fetch(`/api/escrow/hashData`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId: escrowId.toString(),
          txType,
          signer,
        }),
      });

      if (!hashDataResponse.ok) {
        throw new Error('Failed to get hash data');
      }

      const { domain, types, value } = await hashDataResponse.json();

      // Sign the typed data
      const signature = await signTypedData({
        domain,
        types,
        primaryType: 'EscrowTransaction',
        message: value,
      });

      // Submit the signature
      const { data: submitSignatureData, write: submitSignatureWrite } = useContractWrite({
        address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
        abi: SIGNATURE_ESCROW_ABI,
        functionName: 'approveTransactionWithSignature',
      });

      if (submitSignatureWrite) {
        submitSignatureWrite({
          args: [escrowId, txType, signer, userNonce, signature],
        });
      }

      return { success: true, signature };
    } catch (err) {
      console.error('Error signing transaction:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [userNonce]);

  // Helper functions for creating escrows with common configurations
  const createStandardEscrow = useCallback(
    (nftContract: string, tokenId: bigint, price: string) => {
      if (createEscrow) {
        const priceInWei = parseEther(price);
        createEscrow({
          args: [
            nftContract,
            tokenId,
            '0x0000000000000000000000000000000000000000', // Use default token
            priceInWei,
            '0x0000000000000000000000000000000000000000', // No arbiter
            true,  // Require buyer signature
            true,  // Require seller signature
            false, // No arbiter signature required
            2,     // 2 of 2 signatures required
            0n,    // No expiration
          ],
        });
      }
    },
    [createEscrow]
  );

  const createArbiterEscrow = useCallback(
    (nftContract: string, tokenId: bigint, price: string, arbiter: string) => {
      if (createEscrow) {
        const priceInWei = parseEther(price);
        createEscrow({
          args: [
            nftContract,
            tokenId,
            '0x0000000000000000000000000000000000000000', // Use default token
            priceInWei,
            arbiter,
            true,  // Require buyer signature
            true,  // Require seller signature
            true,  // Require arbiter signature
            2,     // 2 of 3 signatures required
            0n,    // No expiration
          ],
        });
      }
    },
    [createEscrow]
  );

  const createTimeLockedEscrow = useCallback(
    (nftContract: string, tokenId: bigint, price: string, expirationDays: number) => {
      if (createEscrow) {
        const priceInWei = parseEther(price);
        const expirationTime = BigInt(Math.floor(Date.now() / 1000) + expirationDays * 86400);
        
        createEscrow({
          args: [
            nftContract,
            tokenId,
            '0x0000000000000000000000000000000000000000', // Use default token
            priceInWei,
            '0x0000000000000000000000000000000000000000', // No arbiter
            true,  // Require buyer signature
            true,  // Require seller signature
            false, // No arbiter signature required
            2,     // 2 of 2 signatures required
            expirationTime,
          ],
        });
      }
    },
    [createEscrow]
  );

  // Return all the functions and states
  return {
    currentEscrowId,
    isLoading: isLoading || isCreateEscrowLoading || isAssignBuyerLoading || 
               isDepositPaymentLoading || isAssignArbiterLoading || isApproveTransactionLoading,
    error,
    getEscrowDetails,
    createEscrow,
    assignAsBuyer,
    depositPayment,
    assignArbiter,
    approveTransaction,
    submitSignature,
    createStandardEscrow,
    createArbiterEscrow,
    createTimeLockedEscrow,
  };
} 