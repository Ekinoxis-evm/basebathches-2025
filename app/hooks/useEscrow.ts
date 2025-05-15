import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { config as wagmiConfig } from '@/app/config/wagmi';
import { readContract } from '@wagmi/core';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from '@/app/contracts/config';

// EscrowNFT state types
export enum EscrowState {
  Created = 0,
  BuyerDeposited = 1,
  Accepted = 2,
  Completed = 3,
  Cancelled = 4
}

// Escrow data structure
export interface EscrowData {
  id: string;
  seller: string;
  nftContract: string;
  tokenId: string;
  paymentToken: string;
  price: string;
  buyer: string;
  state: EscrowState;
  sellerSigned: boolean;
  buyerSigned: boolean;
}

// Simplified ABI for EscrowNFT contract
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' }
    ],
    name: 'createEscrow',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'assignAsBuyer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'depositPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'accept', type: 'bool' }
    ],
    name: 'signEscrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    name: 'getEscrowDetails',
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'buyer', type: 'address' },
      { name: 'state', type: 'uint8' },
      { name: 'sellerSigned', type: 'bool' },
      { name: 'buyerSigned', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentEscrowId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
];

// ERC721 approval ABI for NFT contract
const ERC721_APPROVAL_ABI = [
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  }
];

// ERC20 approval ABI for token contract
const ERC20_APPROVAL_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
];

// Contract addresses
const ESCROW_CONTRACT = CONTRACT_ADDRESSES.EscrowNFT;
const VEHICLE_NFT_CONTRACT = CONTRACT_ADDRESSES.VehicleNFT_V2;
const BCOP_TOKEN = "0x34Fa1aED9f275451747f3e9B5377608cCF96A458"; // BCOP token on Base Sepolia

export function useEscrow(escrowId?: string) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  
  // Contract write hooks
  const { writeContractAsync: writeEscrowContract } = useWriteContract();
  const { writeContractAsync: writeNFTContract } = useWriteContract();
  const { writeContractAsync: writeTokenContract } = useWriteContract();
  
  // Read contract hook for escrow details
  const { data: escrowDetails, refetch: refetchEscrowDetails } = useReadContract({
    address: ESCROW_CONTRACT as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'getEscrowDetails',
    args: escrowId ? [BigInt(escrowId)] : undefined,
    query: {
      enabled: !!escrowId,
    }
  });
  
  // Create a new escrow for an NFT
  async function createEscrow(tokenId: string, price: string, paymentToken: string = BCOP_TOKEN) {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // First, check if user has approved the escrow contract for NFT transfers
      const isApproved = await checkNFTApproval(VEHICLE_NFT_CONTRACT, address, ESCROW_CONTRACT);
      
      // If not approved, request approval
      if (!isApproved) {
        await approveNFTContract(VEHICLE_NFT_CONTRACT, ESCROW_CONTRACT);
      }
      
      // Convert price to wei (considering 6 decimals for BCOP)
      const priceInWei = BigInt(parseFloat(price) * 1_000_000);
      
      // Create the escrow
      const txHash = await writeEscrowContract({
        address: ESCROW_CONTRACT as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'createEscrow',
        args: [
          VEHICLE_NFT_CONTRACT as `0x${string}`,
          BigInt(tokenId),
          paymentToken as `0x${string}`,
          priceInWei
        ],
        chainId: baseSepolia.id,
      });
      
      // Return the transaction hash
      return txHash;
    } catch (err) {
      console.error('Error creating escrow:', err);
      setError('Failed to create escrow. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }
  
  // Assign as buyer for an escrow
  async function assignAsBuyer(escrowId: string) {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const txHash = await writeEscrowContract({
        address: ESCROW_CONTRACT as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'assignAsBuyer',
        args: [BigInt(escrowId)],
        chainId: baseSepolia.id,
      });
      
      return txHash;
    } catch (err) {
      console.error('Error assigning as buyer:', err);
      setError('Failed to assign as buyer. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }
  
  // Deposit payment for an escrow
  async function depositPayment(escrowId: string) {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get escrow details to check the payment token and price
      const escrow = await fetchEscrowDetails(escrowId);
      
      if (!escrow) {
        throw new Error('Could not fetch escrow details');
      }
      
      // Check if the token is approved
      const isApproved = await checkTokenApproval(
        escrow.paymentToken,
        address,
        ESCROW_CONTRACT,
        escrow.price
      );
      
      // If not approved, request approval
      if (!isApproved) {
        await approveToken(escrow.paymentToken, ESCROW_CONTRACT, escrow.price);
      }
      
      // Deposit payment
      const txHash = await writeEscrowContract({
        address: ESCROW_CONTRACT as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'depositPayment',
        args: [BigInt(escrowId)],
        chainId: baseSepolia.id,
      });
      
      return txHash;
    } catch (err) {
      console.error('Error depositing payment:', err);
      setError('Failed to deposit payment. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }
  
  // Sign acceptance or cancellation of an escrow
  async function signEscrow(escrowId: string, accept: boolean) {
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const txHash = await writeEscrowContract({
        address: ESCROW_CONTRACT as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'signEscrow',
        args: [BigInt(escrowId), accept],
        chainId: baseSepolia.id,
      });
      
      return txHash;
    } catch (err) {
      console.error('Error signing escrow:', err);
      setError(`Failed to ${accept ? 'accept' : 'cancel'} escrow. Please try again.`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }
  
  // Fetch escrow details by ID
  async function fetchEscrowDetails(id: string): Promise<EscrowData | null> {
    try {
      // Use readContract directly since we might need to call this from other functions
      const result = await readContract(wagmiConfig, {
        address: ESCROW_CONTRACT as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'getEscrowDetails',
        args: [BigInt(id)],
        chainId: baseSepolia.id,
      });
      
      const [seller, nftContract, tokenId, paymentToken, price, buyer, state, sellerSigned, buyerSigned] = result as [string, string, bigint, string, bigint, string, number, boolean, boolean];
      
      const escrow: EscrowData = {
        id,
        seller,
        nftContract,
        tokenId: tokenId.toString(),
        paymentToken,
        price: price.toString(),
        buyer,
        state: state as EscrowState,
        sellerSigned,
        buyerSigned
      };
      
      // Update state if this is the current escrow
      if (id === escrowId) {
        setEscrowData(escrow);
      }
      
      return escrow;
    } catch (err) {
      console.error('Error fetching escrow details:', err);
      setError('Failed to fetch escrow details');
      return null;
    }
  }
  
  // Helper functions for approvals
  
  // Check if NFT contract is approved for the escrow
  async function checkNFTApproval(
    nftContract: string,
    owner: string,
    operator: string
  ): Promise<boolean> {
    try {
      const result = await readContract(wagmiConfig, {
        address: nftContract as `0x${string}`,
        abi: ERC721_APPROVAL_ABI,
        functionName: 'isApprovedForAll',
        args: [owner as `0x${string}`, operator as `0x${string}`],
        chainId: baseSepolia.id,
      });
      
      return result as boolean;
    } catch (err) {
      console.error('Error checking NFT approval:', err);
      return false;
    }
  }
  
  // Approve NFT contract for transfers
  async function approveNFTContract(nftContract: string, operator: string): Promise<string | null> {
    try {
      const txHash = await writeNFTContract({
        address: nftContract as `0x${string}`,
        abi: ERC721_APPROVAL_ABI,
        functionName: 'setApprovalForAll',
        args: [operator as `0x${string}`, true],
        chainId: baseSepolia.id,
      });
      
      return txHash;
    } catch (err) {
      console.error('Error approving NFT contract:', err);
      setError('Failed to approve NFT transfers');
      return null;
    }
  }
  
  // Check if token allowance is sufficient
  async function checkTokenApproval(
    tokenContract: string,
    owner: string,
    spender: string,
    amount: string
  ): Promise<boolean> {
    try {
      const result = await readContract(wagmiConfig, {
        address: tokenContract as `0x${string}`,
        abi: ERC20_APPROVAL_ABI,
        functionName: 'allowance',
        args: [owner as `0x${string}`, spender as `0x${string}`],
        chainId: baseSepolia.id,
      });
      
      const allowance = result as bigint;
      return allowance >= BigInt(amount);
    } catch (err) {
      console.error('Error checking token allowance:', err);
      return false;
    }
  }
  
  // Approve token for spending
  async function approveToken(
    tokenContract: string,
    spender: string,
    amount: string
  ): Promise<string | null> {
    try {
      const txHash = await writeTokenContract({
        address: tokenContract as `0x${string}`,
        abi: ERC20_APPROVAL_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, BigInt(amount)],
        chainId: baseSepolia.id,
      });
      
      return txHash;
    } catch (err) {
      console.error('Error approving token:', err);
      setError('Failed to approve token spending');
      return null;
    }
  }
  
  // Update escrow data when refetch is triggered
  if (escrowDetails && escrowId) {
    const [seller, nftContract, tokenId, paymentToken, price, buyer, state, sellerSigned, buyerSigned] = escrowDetails as [string, string, bigint, string, bigint, string, number, boolean, boolean];
    
    if (!escrowData || escrowData.state !== state) {
      setEscrowData({
        id: escrowId,
        seller,
        nftContract,
        tokenId: tokenId.toString(),
        paymentToken,
        price: price.toString(),
        buyer,
        state: state as EscrowState,
        sellerSigned,
        buyerSigned
      });
    }
  }
  
  return {
    escrowData,
    isLoading,
    error,
    createEscrow,
    assignAsBuyer,
    depositPayment,
    signEscrow,
    fetchEscrowDetails,
    refetchEscrowDetails
  };
} 