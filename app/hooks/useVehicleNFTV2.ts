import { useWriteContract, useAccount, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACT_OWNER, VEHICLE_NFT_V2_ABI } from '@/app/contracts/config';
import { baseSepolia } from 'wagmi/chains';

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
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isLoading = isPending || isConfirming;
  
  // Check if user is on the correct chain (Base Sepolia)
  const isOnCorrectChain = chainId === baseSepolia.id;
  
  // Function to switch to Base Sepolia if needed
  const ensureCorrectChain = async (): Promise<boolean> => {
    if (isOnCorrectChain) return true;
    
    try {
      console.log('Switching to Base Sepolia...');
      await switchChain({ chainId: baseSepolia.id });
      return true;
    } catch (err) {
      console.error('Failed to switch chain:', err);
      throw new Error('Para tokenizar vehículos, debes usar la red Base Sepolia. Por favor, cambia de red e inténtalo de nuevo.');
    }
  };
  
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
    if (!address) throw new Error('Wallet not connected');
    
    // Ensure user is on the correct chain
    await ensureCorrectChain();
    
    try {
      console.log('Public minting with:', {
        contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2,
        walletAddress: address,
        tokenURI: params.tokenMetadata.uri
      });
      
      return writeContract({
        ...contractConfig,
        functionName: 'publicMintVehicleNFT',
        args: [params.tokenMetadata.uri]
      });
    } catch (err) {
      console.error('Error during public minting:', err);
      throw err;
    }
  };

  // Original mint function (owner only)
  const mintVehicleNFT = async (params: MintParams) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractOwner()) {
      console.warn('Non-owner wallet attempting to use owner-only minting function');
    }
    
    // Ensure user is on the correct chain
    await ensureCorrectChain();
    
    try {
      console.log('Owner minting with:', {
        contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2,
        walletAddress: address,
        recipientAddress: address,
        isOwner: isContractOwner(),
        tokenURI: params.tokenMetadata.uri
      });
      
      return writeContract({
        ...contractConfig,
        functionName: 'mintVehicleNFT',
        args: [address, params.tokenMetadata.uri]
      });
    } catch (err) {
      console.error('Error during owner minting:', err);
      throw err;
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

  return { 
    mintVehicleNFT,
    publicMintVehicleNFT,
    smartMintVehicleNFT,
    authorizeMinter,
    isContractOwner,
    isLoading, 
    isSuccess, 
    error,
    transactionHash: hash,
    transactionUrl: getTransactionUrl(),
    contractAddress: CONTRACT_ADDRESSES.VehicleNFT_V2,
    ownerAddress: CONTRACT_OWNER,
    isOnCorrectChain,
    ensureCorrectChain
  };
} 