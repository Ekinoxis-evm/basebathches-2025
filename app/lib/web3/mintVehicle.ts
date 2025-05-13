import { ethers } from 'ethers';
import vehicleNFTAbi from '../../contracts/abi/VehicleNFT.json';

const contractAddress = vehicleNFTAbi.address;
const abi = vehicleNFTAbi.abi;


export const mintVehicleNFT = async (metadataUrl: string, userAddress: string): Promise<string> => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const tx = await contract.mintVehicleNFT(userAddress, metadataUrl);
  await tx.wait();
  return tx.hash;
};
