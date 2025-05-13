import { useWriteContract } from 'wagmi';
import addresses from '../src/contracts/addresses.json';

// Define proper types for the function arguments
type VehicleAttributes = {
  brand: string;
  model: string;
  year: number;
  // Add other vehicle properties as needed
};

type TokenMetadata = {
  uri: string;
  // Add other metadata properties as needed
};

const VehicleNFT = {
  abi: [
    {
      inputs: [
        { name: 'vehicleData', type: 'tuple', components: [
          { name: 'brand', type: 'string' },
          { name: 'model', type: 'string' },
          { name: 'year', type: 'uint256' }
          // Add other components that match your contract
        ]},
        { name: 'tokenURI', type: 'string' }
      ],
      name: 'mintVehicleNFT',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  _format: '...',
  contractName: 'VehicleNFT',
  sourceName: '...',
};

export function useVehicleNFT(vehicleData: VehicleAttributes, tokenMetadata: TokenMetadata) {
  const contractConfig = {
    address: addresses.VehicleNFT as `0x${string}`,
    abi: VehicleNFT.abi,
  };

  const { writeContract, isSuccess, error, status } = useWriteContract();

  const isLoading = status === 'pending';

  const mintVehicleNFT = async () => {
    try {
      await writeContract({
        ...contractConfig,
        functionName: 'mintVehicleNFT',
        args: [vehicleData, tokenMetadata.uri]
      });
    } catch (err) {
      console.error('Error minting NFT:', err);
      throw err; // Re-throw to allow handling in the UI
    }
  };

  return { mintVehicleNFT, isLoading, isSuccess, error };
}