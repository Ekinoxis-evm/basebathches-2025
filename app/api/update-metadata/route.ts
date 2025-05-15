import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import PinataSDK from '@pinata/sdk';

// Initialize Pinata client if credentials are available
const pinata = process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY
  ? new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY)
  : null;

// Type for metadata structure
interface MetadataUpdate {
  metadataUri: string;
  tokenId: string | number;
  contractAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Pinata client is available
    if (!pinata) {
      console.warn('Pinata API credentials missing. Cannot update metadata in IPFS.');
      return NextResponse.json({ 
        error: 'Pinata API credentials missing',
        success: false
      }, { status: 500 });
    }

    // Parse the request body
    const data: MetadataUpdate = await request.json();
    
    if (!data.metadataUri || !data.tokenId) {
      return NextResponse.json({ 
        error: 'Missing required fields: metadataUri and tokenId',
        success: false
      }, { status: 400 });
    }

    // Extract the IPFS hash from the metadata URI
    let ipfsHash = data.metadataUri;
    if (ipfsHash.startsWith('ipfs://')) {
      ipfsHash = ipfsHash.replace('ipfs://', '');
    }

    // Fetch the current metadata from IPFS
    try {
      // Fetch the JSON from IPFS using Pinata gateway
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const response = await fetch(gatewayUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata from IPFS: ${response.statusText}`);
      }
      
      const metadata = await response.json();
      
      // Update the metadata with the token ID
      if (metadata.opensea) {
        metadata.opensea.tokenId = data.tokenId;
        if (data.contractAddress) {
          metadata.opensea.contractAddress = data.contractAddress;
        }
      } else {
        metadata.opensea = {
          tokenId: data.tokenId,
          contractAddress: data.contractAddress || process.env.NFT_CONTRACT_ADDRESS
        };
      }
      
      // Add token ID to attributes if not already present
      if (metadata.attributes) {
        if (!metadata.attributes.some((attr: any) => attr.trait_type === 'Token ID')) {
          metadata.attributes.push({
            trait_type: 'Token ID',
            value: data.tokenId.toString()
          });
        }
      }
      
      // Upload the updated metadata to IPFS
      const metadataFileName = `updated-vehicle-metadata-${data.tokenId}.json`;
      
      const metadataUploadResult = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: metadataFileName,
        },
        pinataOptions: {
          cidVersion: 1
        }
      });
      
      const updatedMetadataUri = `ipfs://${metadataUploadResult.IpfsHash}`;
      
      // Return success with new URI
      return NextResponse.json({ 
        success: true,
        originalUri: data.metadataUri,
        updatedUri: updatedMetadataUri,
        tokenId: data.tokenId,
        openseaUrl: `https://testnets.opensea.io/assets/base-sepolia/${data.contractAddress || process.env.NFT_CONTRACT_ADDRESS}/${data.tokenId}`
      }, { status: 200 });
      
    } catch (fetchError) {
      console.error('Error fetching or updating metadata:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch or update metadata',
        details: (fetchError as Error).message,
        success: false
      }, { status: 500 });
    }
    
  } catch (error: unknown) {
    console.error('Error in metadata update process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to process metadata update request', 
      details: errorMessage,
      success: false
    }, { status: 500 });
  }
} 