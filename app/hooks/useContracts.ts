import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import addresses from '../src/contracts/addresses.json';

// Define a type for the mint function parameters
type MintParams = {
  tokenMetadata: {
    uri: string;
  };
};

const VehicleNFT = {
  abi: [
    {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'tokenURI', type: 'string' }
      ],
      name: 'mintVehicleNFT',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'tokenId', type: 'uint256' },
        { indexed: false, name: 'tokenURI', type: 'string' }
      ],
      name: 'VehicleNFTMinted',
      type: 'event',
    },
  ],
  contractName: 'VehicleNFT',
};

export function useVehicleNFT() {
  const contractConfig = {
    address: addresses.VehicleNFT as `0x${string}`,
    abi: VehicleNFT.abi,
  };

  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isLoading = isPending || isConfirming;

  const mintVehicleNFT = async (params: MintParams) => {
    if (!address) throw new Error('Wallet not connected');
    
    try {
      return writeContract({
        ...contractConfig,
        functionName: 'mintVehicleNFT',
        args: [address, params.tokenMetadata.uri]
      });
    } catch (err) {
      console.error('Error minting NFT:', err);
      throw err;
    }
  };

  // Get the transaction URL based on network
  const getTransactionUrl = () => {
    if (!hash) return null;
    // We're using Base network
    return `https://basescan.org/tx/${hash}`;
  };

  return { 
    mintVehicleNFT, 
    isLoading, 
    isSuccess, 
    error,
    transactionHash: hash,
    transactionUrl: getTransactionUrl()
  };
} 