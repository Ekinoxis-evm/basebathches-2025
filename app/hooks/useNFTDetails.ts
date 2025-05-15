import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { baseSepolia } from 'wagmi/chains';
import { config } from '@/app/config/wagmi';
import { CONTRACT_ADDRESSES } from '../contracts/config';

// Define interface for NFT details
interface NFTDetails {
  id: string;
  tokenId: string;
  title: string;
  image: string;
  owner: string;
  status: string;
  placa?: string;
  fechaMatriculaInicial?: string;
  marca?: string;
  linea?: string;
  modelo?: string;
  cilindraje?: string;
  color?: string;
  servicio?: string;
  claseVehiculo?: string;
  tipoCarroceria?: string;
  combustible?: string;
  capacidad?: string;
  numeroMotor?: string;
  vin?: string;
  numeroSerie?: string;
  numeroChasis?: string;
  blindaje?: string;
  declaracionImportacion?: string;
}

// Contract Address from VehicleNFT_V2
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.VehicleNFT_V2;

// Simplified ABI with only the functions we need
const NFT_ABI = [
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  }
];

export function useNFTDetails(tokenId: string) {
  const { address } = useAccount();
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFTDetails() {
      if (!tokenId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching details for token ID: ${tokenId}`);
        
        // Try to fetch the owner of the token
        let ownerAddress = null;
        
        try {
          // Method 1: Call the RPC endpoint
          const endpoints = [
            `https://sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/ownerOf?args=["${tokenId}"]`,
            `https://api.sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/ownerOf?args=[${tokenId}]`
          ];
          
          for (const endpoint of endpoints) {
            try {
              const result = await fetch(endpoint);
              const data = await result.json();
              if (data.result) {
                ownerAddress = data.result;
                break;
              }
            } catch (err) {
              console.warn(`Failed endpoint ${endpoint}:`, err);
            }
          }
          
          // Method 2: Use wagmi if RPC didn't work
          if (!ownerAddress) {
            const result = await readContract(config, {
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: NFT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)],
              chainId: baseSepolia.id,
            });
            ownerAddress = result as string;
          }
          
          console.log(`Token ${tokenId} owner:`, ownerAddress);
          setOwner(ownerAddress);
        } catch (err) {
          console.error(`Failed to fetch owner for token ${tokenId}:`, err);
          // We'll continue even if we can't get the owner
        }
        
        // Try to fetch the token URI
        let tokenURI = null;
        
        try {
          // Method 1: Call the RPC endpoint
          const endpoints = [
            `https://sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/tokenURI?args=["${tokenId}"]`,
            `https://api.sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/tokenURI?args=[${tokenId}]`
          ];
          
          for (const endpoint of endpoints) {
            try {
              const result = await fetch(endpoint);
              const data = await result.json();
              if (data.result) {
                tokenURI = data.result;
                break;
              }
            } catch (err) {
              console.warn(`Failed endpoint ${endpoint}:`, err);
            }
          }
          
          // Method 2: Use wagmi if RPC didn't work
          if (!tokenURI) {
            const result = await readContract(config, {
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: NFT_ABI,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
              chainId: baseSepolia.id,
            });
            tokenURI = result as string;
          }
          
          console.log(`Token ${tokenId} URI:`, tokenURI);
        } catch (err) {
          console.error(`Failed to fetch URI for token ${tokenId}:`, err);
          throw new Error(`Could not fetch metadata for token ${tokenId}`);
        }
        
        if (!tokenURI) {
          throw new Error(`No URI found for token ${tokenId}`);
        }
        
        // Process the metadata
        const nft = await processNFTMetadata(tokenId, tokenURI, ownerAddress);
        setNftDetails(nft);
      } catch (error: any) {
        console.error('Error fetching NFT details:', error);
        setError(error.message || 'Failed to fetch NFT details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTDetails();
  }, [tokenId]);

  // Process NFT metadata from URI
  async function processNFTMetadata(tokenId: string, uri: string, ownerAddress: string | null): Promise<NFTDetails> {
    try {
      // Convert IPFS URI if needed
      let httpUri = uri;
      if (uri.startsWith('ipfs://')) {
        httpUri = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      
      console.log(`Fetching metadata from: ${httpUri}`);
      
      // Fetch metadata
      const response = await fetch(httpUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
      }
      
      const metadata = await response.json();
      console.log(`Metadata for token ${tokenId}:`, metadata);
      
      // Convert image IPFS URI if present
      let imageUrl = metadata.image || '';
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      
      // For NFTs without an image, use a default
      if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1594502184342-2543a32f36f0?auto=format&fit=crop&q=80';
      }

      // Define a type for NFT attributes
      interface NFTAttribute {
        trait_type: string;
        value: string | number;
      }

      // Extract attributes from metadata
      const getAttributeValue = (traitType: string): string => {
        if (!metadata.attributes) return '';
        
        const attr = metadata.attributes.find(
          (attr: NFTAttribute) => attr.trait_type.toLowerCase() === traitType.toLowerCase()
        );
        
        return attr ? attr.value.toString() : '';
      };

      // Build the NFT details object
      return {
        id: tokenId,
        tokenId: tokenId,
        title: metadata.name || `Car #${tokenId}`,
        image: imageUrl,
        owner: ownerAddress || 'Unknown',
        status: 'Owned',
        placa: metadata.placa || metadata.licensePlate || getAttributeValue('placa') || '',
        fechaMatriculaInicial: getAttributeValue('fechaMatriculaInicial') || '',
        marca: metadata.marca || getAttributeValue('marca') || '',
        linea: metadata.linea || getAttributeValue('linea') || '',
        modelo: metadata.modelo || getAttributeValue('modelo') || '',
        cilindraje: getAttributeValue('cilindraje') || '',
        color: metadata.color || getAttributeValue('color') || '',
        servicio: getAttributeValue('servicio') || '',
        claseVehiculo: getAttributeValue('claseVehiculo') || '',
        tipoCarroceria: getAttributeValue('tipoCarroceria') || '',
        combustible: getAttributeValue('combustible') || '',
        capacidad: getAttributeValue('capacidad') || '',
        numeroMotor: getAttributeValue('numeroMotor') || '',
        vin: metadata.vin || getAttributeValue('vin') || '',
        numeroSerie: getAttributeValue('numeroSerie') || '',
        numeroChasis: getAttributeValue('numeroChasis') || '',
        blindaje: getAttributeValue('blindaje') || '',
        declaracionImportacion: getAttributeValue('declaracionImportacion') || '',
      };
    } catch (error) {
      console.error(`Error processing metadata for token ${tokenId}:`, error);
      
      // Return a basic NFT object if metadata processing fails
      return {
        id: tokenId,
        tokenId: tokenId,
        title: `Car #${tokenId}`,
        image: 'https://images.unsplash.com/photo-1594502184342-2543a32f36f0?auto=format&fit=crop&q=80',
        owner: ownerAddress || 'Unknown',
        status: 'Owned',
        placa: '',
      };
    }
  }

  return { nftDetails, isLoading, error, owner };
} 