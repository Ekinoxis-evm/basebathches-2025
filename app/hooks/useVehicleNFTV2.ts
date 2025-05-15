import { useWriteContract, useAccount, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACT_OWNER, VEHICLE_NFT_V2_ABI } from '../contracts/config';
import { baseSepolia } from 'wagmi/chains';
import { useCallback } from 'react';

// Define a type for the mint function parameters
type MintParams = {
  tokenMetadata: {
    uri: string;
  };
};

export function useVehicleNFTV2() {
  const contractConfig = {
    address: CONTRACT_ADDRESSES.VehicleNFT_V2 as `0x${string}`,
    abi: VEHICLE_NFT_V2_ABI,
  };

  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const isLoading = isPending || isConfirming;
  
  // Check if user is on the correct chain (Base Sepolia)
  const isOnCorrectChain = chainId === baseSepolia.id;
  
  // Function to switch to Base Sepolia if needed
  const ensureCorrectChain = useCallback(() => {
    if (!isOnCorrectChain) {
      throw new Error('Please switch to Base Sepolia network');
    }
    return true;
  }, [isOnCorrectChain]);
  
  // Check if the connected wallet is the contract owner
  const isContractOwner = (): boolean => {
    if (!address) return false;
    return address.toLowerCase() === CONTRACT_OWNER.toLowerCase();
  };

  // Smart mint function that tries both methods
  const smartMintVehicleNFT = async (params: MintParams) => {
    if (!address) throw new Error('Wallet not connected');
    
    // Ensure user is on the correct chain
    await ensureCorrectChain();
    
    try {
      // Log all relevant information for debugging
      console.log('Smart minting with:', {
        contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2,
        walletAddress: address,
        isOwner: isContractOwner(),
        tokenURI: params.tokenMetadata.uri
      });
      
      // If the connected wallet is the contract owner, use the owner function
      if (isContractOwner()) {
        console.log('Using owner minting method...');
        return writeContract({
          ...contractConfig,
          functionName: 'mintVehicleNFT',
          args: [address, params.tokenMetadata.uri]
        });
      }
      
      // Otherwise, try the public mint function
      console.log('Using public minting method...');
      return writeContract({
        ...contractConfig,
        functionName: 'publicMintVehicleNFT',
        args: [params.tokenMetadata.uri]
      });
    } catch (err) {
      console.error('Error during smart minting:', err);
      throw err;
    }
  };

  // Public mint function that doesn't require owner privileges
  const publicMintVehicleNFT = async (params: MintParams) => {
    try {
      ensureCorrectChain();
      
      console.log('Minting NFT with URI:', params.tokenMetadata.uri);
      
      const tx = await writeContract({
        ...contractConfig,
        functionName: 'publicMintVehicleNFT',
        args: [params.tokenMetadata.uri],
      });
      
      // Log success and OpenSea URL once confirmed
      console.log('NFT mint transaction hash:', tx);
      console.log('View transaction:', `https://sepolia.basescan.org/tx/${tx}`);
      // Note: At this point we don't know the token ID yet until the transaction is confirmed
      
      return tx;
    } catch (error) {
      console.error('Error in publicMintVehicleNFT:', error);
      throw error;
    }
  };

  // Original mint function (owner only)
  const mintVehicleNFT = async (params: MintParams) => {
    try {
      ensureCorrectChain();
      
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Owner minting NFT with URI:', params.tokenMetadata.uri);
      console.log('Minting to address:', address);
      
      const tx = await writeContract({
        ...contractConfig,
        functionName: 'mintVehicleNFT',
        args: [address, params.tokenMetadata.uri],
      });
      
      // Log success and OpenSea URL once confirmed
      console.log('NFT mint transaction hash:', tx);
      console.log('View transaction:', `https://sepolia.basescan.org/tx/${tx}`);
      // Note: At this point we don't know the token ID yet until the transaction is confirmed
      
      return tx;
    } catch (error) {
      console.error('Error in mintVehicleNFT:', error);
      throw error;
    }
  };

  // Function to authorize a minter (owner only)
  const authorizeMinter = async (minterAddress: `0x${string}`) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractOwner()) throw new Error('Only the contract owner can authorize minters');
    
    // Ensure user is on the correct chain
    await ensureCorrectChain();
    
    try {
      console.log(`Authorizing minter address: ${minterAddress}`);
      return writeContract({
        ...contractConfig,
        functionName: 'authorizeMinter',
        args: [minterAddress]
      });
    } catch (err) {
      console.error('Error authorizing minter:', err);
      throw err;
    }
  };

  // Get the transaction URL based on network
  const getTransactionUrl = () => {
    if (!hash) return null;
    // We're using Base Sepolia testnet
    return `https://sepolia.basescan.org/tx/${hash}`;
  };

  // Format OpenSea URL for the NFT
  const getOpenSeaUrl = (tokenId: string, contractAddress: string = CONTRACT_ADDRESSES.VehicleNFT_V2) => {
    return `https://testnets.opensea.io/assets/base_sepolia/${contractAddress}/${tokenId}`;
  };

  return { 
    mintVehicleNFT,
    publicMintVehicleNFT,
    smartMintVehicleNFT,
    authorizeMinter,
    isContractOwner,
    isLoading, 
    isSuccess: isConfirmed, 
    error,
    transactionHash: hash,
    transactionUrl: getTransactionUrl(),
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2,
    ownerAddress: CONTRACT_OWNER,
    isOnCorrectChain,
    ensureCorrectChain,
    getOpenSeaUrl
  };
} 