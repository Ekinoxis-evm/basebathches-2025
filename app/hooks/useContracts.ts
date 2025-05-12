import { useWriteContract } from 'wagmi';
import VehicleNFTABI from '../src/contracts/VehicleNFT.json';
import addresses from '../src/contracts/addresses.json';

export function useVehicleNFT() {
  const contractConfig = {
    address: addresses.VehicleNFT as `0x${string}`,
    abi: VehicleNFTABI,
  };

  const mintVehicleNFT = useWriteContract({
    ...contractConfig,
    functionName: 'mintVehicleNFT',
  });

  return { mintVehicleNFT };
}