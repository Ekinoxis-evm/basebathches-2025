import axios from 'axios';

export const uploadImageToIPFS = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    maxContentLength: Infinity, // corregido aquí
    headers: {
      'Content-Type': `multipart/form-data`,
      pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
      pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!
    }
  });
  

  return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
};

export const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
  const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
    headers: {
      pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
      pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!
    }
  });

  return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
};
