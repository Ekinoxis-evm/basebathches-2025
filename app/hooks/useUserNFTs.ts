import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { baseSepolia } from 'wagmi/chains';
import { config } from '@/app/config/wagmi';
import { CONTRACT_ADDRESSES } from '@/app/contracts/config';

// Define interfaces
interface NFT {
  id: string;
  tokenId: string;
  title: string;
  description: string;
  image: string;
  status: string;
  placa: string;
  contractAddress: string;
  tokenURI?: string;
  price?: string;
}

// For debugging - toggle to true to see mock data
const USE_MOCK_DATA = true;

// Contract Address from VehicleNFT_V2 - hardcoded to ensure correct address
const CONTRACT_ADDRESS = '0x20AdEbac56B2b2d7FE7967fCec780363A070be3A';

// Log contract address for debugging
console.log('Using contract address:', CONTRACT_ADDRESS);

// Simplified ABI with only the functions we need
const NFT_ABI = [
  {
    inputs: [],
    name: 'totalMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
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

// Generate mock NFT data for testing
function getMockNFTs(): NFT[] {
  return [
    {
      id: '1',
      tokenId: '1',
      title: 'Toyota Corolla 2022',
      description: 'A well-maintained 2022 Toyota Corolla sedan with low mileage and all service records.',
      image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Owned',
      placa: 'ABC123',
      contractAddress: CONTRACT_ADDRESS,
      tokenURI: 'ipfs://example1'
    },
    {
      id: '2',
      tokenId: '2',
      title: 'Chevrolet Camaro 2020',
      description: 'Powerful 2020 Chevrolet Camaro sports car with V8 engine and premium features.',
      image: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.1.0',
      status: 'Listed for Sale',
      placa: 'XYZ789',
      contractAddress: CONTRACT_ADDRESS,
      tokenURI: 'ipfs://example2',
      price: '2.8',
    }
  ];
}

export function useUserNFTs() {
  const { address, isConnected } = useAccount();
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the total supply of NFTs
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: 'totalMinted',
  });

  // Debug the contract and connected address
  useEffect(() => {
    console.log("🔍 useUserNFTs debug info:");
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("Connected address:", address);
    console.log("Is connected:", isConnected);
    console.log("Total supply:", totalSupply?.toString() || "not loaded yet");
  }, [address, isConnected, totalSupply]);

  useEffect(() => {
    async function fetchNFTs() {
      if (!isConnected || !address) {
        setIsLoading(false);
        // Initialize with mock data instead of empty array
        setUserNFTs(getMockNFTs());
        return;
      }

      // For debugging, use mock data if enabled
      if (USE_MOCK_DATA) {
        console.log('Using mock NFT data for debugging');
        setUserNFTs(getMockNFTs());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log('Fetching NFTs for wallet:', address);

      try {
        // Log total minted tokens if available
        if (totalSupply) {
          console.log('Total minted NFTs:', totalSupply.toString());
        } else {
          console.log('Total supply not available yet, using default value');
        }
        
        // Create batch requests to check ownership for all token IDs
        const totalMinted = totalSupply ? Number(totalSupply) : 50; // Check up to 50 tokens if totalSupply is not available
        console.log(`Checking ownership for tokens 0 to ${totalMinted}`);
        
        // Array to collect NFTs
        const nftsFound: NFT[] = [];
        
        // We'll check each token ID individually to avoid the complexity of batch calls
        // Start from 0 as some contracts start counting from 0
        for (let tokenId = 0; tokenId <= totalMinted; tokenId++) {
          try {
            console.log(`Checking token ${tokenId}...`);
            // Check if the current user owns this token - try multiple methods
            let ownerAddress = null;
            
            try {
              // Method 1: Call the RPC endpoint
              ownerAddress = await fetchOwnerOf(tokenId);
              console.log(`Token ${tokenId} owner (Method 1):`, ownerAddress);
            } catch (err) {
              console.warn(`Failed to fetch owner using Method 1 for token ${tokenId}:`, err);
              
              try {
                // Method 2: Use wagmi core readContract with config parameter
                const result = await readContract(config, {
                  address: CONTRACT_ADDRESS as `0x${string}`,
                  abi: NFT_ABI,
                  functionName: 'ownerOf',
                  args: [BigInt(tokenId)],
                  chainId: baseSepolia.id,
                });
                ownerAddress = result as string;
                console.log(`Token ${tokenId} owner (Method 2):`, ownerAddress);
              } catch (err2) {
                console.warn(`Failed to fetch owner using Method 2 for token ${tokenId}:`, err2);
              }
            }
            
            // Compare addresses case-insensitively
            const ownerMatches = ownerAddress && address && 
              ownerAddress.toLowerCase() === address.toLowerCase();
              
            if (ownerMatches) {
              console.log(`Token ${tokenId} is owned by the current wallet`);
              
              // Fetch token URI - try multiple methods
              let uri = null;
              
              try {
                // Method 1: Call the RPC endpoint
                uri = await fetchTokenURI(tokenId);
                console.log(`Token ${tokenId} URI (Method 1):`, uri);
              } catch (err) {
                console.warn(`Failed to fetch URI using Method 1 for token ${tokenId}:`, err);
                
                try {
                  // Method 2: Use wagmi core readContract with config parameter
                  const result = await readContract(config, {
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: NFT_ABI,
                    functionName: 'tokenURI',
                    args: [BigInt(tokenId)],
                    chainId: baseSepolia.id,
                  });
                  uri = result as string;
                  console.log(`Token ${tokenId} URI (Method 2):`, uri);
                } catch (err2) {
                  console.warn(`Failed to fetch URI using Method 2 for token ${tokenId}:`, err2);
                }
              }
              
              if (uri) {
                // Process the token metadata
                console.log(`Processing metadata for token ${tokenId}`);
                const nft = await processNFTMetadata(tokenId, uri);
                nftsFound.push(nft);
                console.log(`Added NFT to collection:`, nft);
              } else {
                console.warn(`No URI found for token ${tokenId} despite owner match`);
              }
            } else if (ownerAddress) {
              console.log(`Token ${tokenId} is owned by ${ownerAddress}, not the current wallet ${address}`);
            } else {
              console.log(`Could not determine owner for token ${tokenId}`);
            }
          } catch (err) {
            console.error(`Error checking token ${tokenId}:`, err);
            // Continue with next token
          }
        }
        
        console.log(`Found ${nftsFound.length} NFTs owned by wallet ${address}`, nftsFound);
        setUserNFTs(nftsFound);
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
        setError('Failed to fetch your NFTs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTs();
  }, [address, isConnected, totalSupply]);

  // Helper function to fetch owner of a token
  async function fetchOwnerOf(tokenId: number): Promise<string | null> {
    try {
      // Try multiple Base Sepolia RPC formats and endpoints
      const endpoints = [
        `https://sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/ownerOf?args=["${tokenId}"]`,
        `https://api.sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/ownerOf?args=[${tokenId}]`,
        `https://base-sepolia.blockpi.network/v1/rpc/public/eth_call`,
        `https://sepolia.base.org`
      ];
      
      for (const endpoint of endpoints) {
        try {
          if (endpoint.includes('eth_call') || !endpoint.includes('ownerOf')) {
            // Use ethers style call for non-specific endpoints
            continue; // Skip for now, focus on direct endpoints
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const result = await fetch(endpoint, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          const data = await result.json();
          if (data.result) {
            return data.result;
          }
        } catch (err) {
          console.warn(`Failed endpoint ${endpoint}:`, err);
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error in fetchOwnerOf:', err);
      return null;
    }
  }

  // Helper function to fetch token URI
  async function fetchTokenURI(tokenId: number): Promise<string | null> {
    try {
      // Try multiple Base Sepolia RPC formats and endpoints
      const endpoints = [
        `https://sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/tokenURI?args=["${tokenId}"]`,
        `https://api.sepolia.base.org/v1/address/${CONTRACT_ADDRESS}/tokenURI?args=[${tokenId}]`,
        `https://base-sepolia.blockpi.network/v1/rpc/public/eth_call`,
        `https://sepolia.base.org`
      ];
      
      for (const endpoint of endpoints) {
        try {
          if (endpoint.includes('eth_call') || !endpoint.includes('tokenURI')) {
            // Use ethers style call for non-specific endpoints
            continue; // Skip for now, focus on direct endpoints
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const result = await fetch(endpoint, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          const data = await result.json();
          if (data.result) {
            return data.result;
          }
        } catch (err) {
          console.warn(`Failed endpoint ${endpoint}:`, err);
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error in fetchTokenURI:', err);
      return null;
    }
  }

  // Process NFT metadata from URI
  async function processNFTMetadata(tokenId: number, uri: string): Promise<NFT> {
    try {
      // Store original URI for reference
      const originalUri = uri;
      
      // Convert IPFS URI if needed
      let httpUri = uri;
      if (uri.startsWith('ipfs://')) {
        // Try multiple gateways
        httpUri = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }
      
      // Alternative IPFS gateways if the primary one fails
      const ipfsGateways = [
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://gateway.ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/'
      ];
      
      console.log(`Fetching metadata from: ${httpUri}`);
      
      // Fetch metadata with a timeout
      let response = null;
      let fetchError = null;
      
      // Try the primary URI first
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        response = await fetch(httpUri, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.warn(`Failed to fetch from primary gateway: ${err}`);
        fetchError = err;
        
        // If primary gateway fails and this is an IPFS URI, try alternative gateways
        if (uri.startsWith('ipfs://')) {
          const cid = uri.replace('ipfs://', '');
          
          for (const gateway of ipfsGateways) {
            if (response && response.ok) break;
            
            try {
              console.log(`Trying alternative gateway: ${gateway}${cid}`);
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              
              response = await fetch(`${gateway}${cid}`, { signal: controller.signal });
              clearTimeout(timeoutId);
              
              if (response.ok) {
                console.log(`Successfully fetched from ${gateway}`);
                break;
              }
            } catch (err) {
              console.warn(`Failed gateway ${gateway}: ${err}`);
            }
          }
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to fetch metadata from all sources: ${fetchError}`);
      }
      
      const metadata = await response.json();
      console.log(`Metadata for token ${tokenId}:`, metadata);
      
      // Convert image IPFS URI if present
      let imageUrl = metadata.image || '';
      if (imageUrl.startsWith('ipfs://')) {
        // Try multiple gateways for image too
        for (const gateway of ipfsGateways) {
          const imageCid = imageUrl.replace('ipfs://', '');
          
          try {
            const gatewayImageUrl = `${gateway}${imageCid}`;
            // Verify the image URL works
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const imgResponse = await fetch(gatewayImageUrl, { 
              method: 'HEAD',
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (imgResponse.ok) {
              imageUrl = gatewayImageUrl;
              break;
            }
          } catch (err) {
            console.warn(`Failed image gateway ${gateway}: ${err}`);
          }
        }
      }
      
      // For NFTs without an image, use the default
      if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1594502184342-2543a32f36f0?auto=format&fit=crop&q=80';
      }
      
      // Define a type for NFT attributes
      interface NFTAttribute {
        trait_type: string;
        value: string | number;
      }

      return {
        id: tokenId.toString(),
        tokenId: tokenId.toString(),
        title: metadata.name || `Car #${tokenId}`,
        description: metadata.description || `Vehicle with token ID ${tokenId}`,
        image: imageUrl,
        status: 'Owned',
        placa: metadata.placa || metadata.licensePlate || metadata.attributes?.find((attr: NFTAttribute) => attr.trait_type === 'Placa')?.value?.toString() || '',
        contractAddress: CONTRACT_ADDRESS,
        tokenURI: originalUri
      };
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      
      // Return a basic NFT object if metadata fetch fails
      return {
        id: tokenId.toString(),
        tokenId: tokenId.toString(),
        title: `Car #${tokenId}`,
        description: `Vehicle token ID ${tokenId}`,
        image: 'https://images.unsplash.com/photo-1594502184342-2543a32f36f0?auto=format&fit=crop&q=80',
        status: 'Owned',
        placa: '',
        contractAddress: CONTRACT_ADDRESS,
        tokenURI: uri
      };
    }
  }

  // Sort NFTs by token ID before returning
  useEffect(() => {
    if (userNFTs.length > 0) {
      // Sort NFTs by token ID in ascending order
      userNFTs.sort((a, b) => {
        const tokenIdA = parseInt(a.tokenId);
        const tokenIdB = parseInt(b.tokenId);
        return tokenIdA - tokenIdB;
      });
    }
  }, [userNFTs]);

  return { userNFTs, isLoading, error };
} 