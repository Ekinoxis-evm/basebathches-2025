import { NextRequest, NextResponse } from 'next/server';
import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';

// Default image CID to use if no image is provided or if there's an error
const DEFAULT_IMAGE_CID = process.env.NEXT_PUBLIC_DEFAULT_IMAGE_CID || 'QmZ4vLGb5KWQeqC3qJxQgjuV8GV1YBDwgdU4AJth3HVdEz';

// Check if Pinata credentials are available
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

// Create Pinata client if credentials are available
const pinata = PINATA_API_KEY && PINATA_API_SECRET 
  ? new PinataClient({
      pinataApiKey: PINATA_API_KEY,
      pinataSecretApiKey: PINATA_API_SECRET,
    })
  : null;

// Define an interface for metadata attributes
interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

export async function POST(request: NextRequest) {
  try {
    // Extract all form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const metadata = formData.get('metadata') as string;
    const placa = formData.get('placa') as string;
    
    if (!metadata) {
      return NextResponse.json({ error: 'Metadata is required' }, { status: 400 });
    }
    
    // Parse metadata
    let metadataObj;
    try {
      metadataObj = JSON.parse(metadata);
    } catch {
      return NextResponse.json({ error: 'Invalid metadata JSON format' }, { status: 400 });
    }

    // Add timestamp to metadata
    metadataObj.created_at = new Date().toISOString();
    
    // Handle image upload
    let imageCid = '';
    let imageUploadSuccess = false;
    
    if (imageFile) {
      try {
        // Check if Pinata client is available
        if (!pinata) {
          console.warn('Pinata API credentials missing. Using default image.');
          imageCid = `ipfs://${DEFAULT_IMAGE_CID}`;
        } else {
          // Convert File to Buffer and create a readable stream
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const stream = new Readable();
          stream.push(buffer);
          stream.push(null);

          const fileName = `vehicle-image-${placa || 'unknown'}-${Date.now()}.${imageFile.name.split('.').pop()}`;
          
          // Add metadata for the image file
          const imageUploadResult = await pinata.pinFileToIPFS(stream, {
            pinataMetadata: {
              name: fileName,
            },
            pinataOptions: {
              cidVersion: 1
            }
          });
          
          imageCid = `ipfs://${imageUploadResult.IpfsHash}`;
          imageUploadSuccess = true;
          console.log(`Image uploaded to IPFS: ${imageCid}`);
        }
      } catch (imageError) {
        console.error('Error uploading image to IPFS:', imageError);
        imageCid = `ipfs://${DEFAULT_IMAGE_CID}`;
      }
    } else {
      console.log('No image provided, using default image');
      imageCid = `ipfs://${DEFAULT_IMAGE_CID}`;
    }

    // Add image to metadata
    metadataObj.image = imageCid;
    
    // Ensure OpenSea standard metadata fields
    metadataObj.name = metadataObj.name || "Vehicle NFT";
    
    // Make sure description is always included and detailed
    if (!metadataObj.description || metadataObj.description.trim() === '') {
      metadataObj.description = placa 
        ? `Tokenized vehicle with plate ${placa} on CarP2P platform` 
        : "Tokenized vehicle on CarP2P";
      
      console.warn('No description provided in metadata. Using default description.');
    }
    
    metadataObj.external_url = `https://carp2p.com/cars/${placa || 'unknown'}`;

    // Add a direct link to the contract and token ID for OpenSea to properly index
    metadataObj.opensea = {
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
      tokenId: 0 // This will be updated when minted
    };
    
    // Add vehicle type attributes if not present
    if (!metadataObj.attributes) {
      metadataObj.attributes = [];
    }
    
    // Add placa as attribute if not already present
    if (placa && !metadataObj.attributes.some((attr: MetadataAttribute) => attr.trait_type === 'Placa')) {
      metadataObj.attributes.push({
        trait_type: 'Placa',
        value: placa
      });
    }
    
    // Add description as an attribute to ensure it appears in OpenSea
    if (!metadataObj.attributes.some((attr: MetadataAttribute) => attr.trait_type === 'Description')) {
      metadataObj.attributes.push({
        trait_type: 'Description',
        value: metadataObj.description
      });
    }
    
    // Add timestamp as attribute
    metadataObj.attributes.push({
      trait_type: 'Timestamp',
      value: metadataObj.created_at
    });

    // Upload metadata to IPFS
    try {
      // Check if Pinata client is available
      if (!pinata) {
        console.warn('Pinata API credentials missing. Cannot upload metadata to IPFS.');
        return NextResponse.json({ 
          metadataUri: `ipfs://${DEFAULT_IMAGE_CID}`,
          warning: 'Using mock metadata URI due to missing Pinata credentials'
        }, { status: 200 });
      }
      
      const metadataFileName = `vehicle-metadata-${placa || 'unknown'}-${Date.now()}.json`;
      
      const metadataUploadResult = await pinata.pinJSONToIPFS(metadataObj, {
        pinataMetadata: {
          name: metadataFileName,
        },
        pinataOptions: {
          cidVersion: 1
        }
      });
      
      const metadataUri = `ipfs://${metadataUploadResult.IpfsHash}`;
      console.log(`Metadata uploaded to IPFS: ${metadataUri}`);
      
      // Return success with uris
      return NextResponse.json({ 
        metadataUri,
        imageCid,
        imageUploadSuccess,
        warning: !imageUploadSuccess ? 'Used default image due to upload error or missing image' : undefined
      }, { status: 200 });
    } catch (metadataError) {
      console.error('Error uploading metadata to IPFS:', metadataError);
      return NextResponse.json({ 
        error: 'Failed to upload metadata to IPFS', 
        details: (metadataError as Error).message 
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Error in IPFS upload process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to process upload request', 
      details: errorMessage 
    }, { status: 500 });
  }
}