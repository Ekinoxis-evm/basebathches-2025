import Link from 'next/link';
import Image from 'next/image';
import { CONTRACT_ADDRESSES } from '../contracts/config';

// Format contract address if needed
const formatAddress = (address: string) => {
  if (address.startsWith('0x')) {
    return address.toLowerCase();
  }
  return `0x${address}`.toLowerCase();
};

type OpenSeaLinkProps = {
  tokenId: string | number;
  chainName?: string; // e.g., 'base', 'ethereum', etc.
  contractAddress?: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
};

export default function OpenSeaLink({ 
  tokenId, 
  chainName = 'base', 
  contractAddress,
  children, 
  className = '',
  showIcon = true
}: OpenSeaLinkProps) {
  // Use provided contract address or default to the NFT contract from config
  const contract = contractAddress 
    ? formatAddress(contractAddress)
    : formatAddress(CONTRACT_ADDRESSES.VehicleNFT_V2 || '');

  // Format OpenSea URL - for testnets use testnets.opensea.io
  const isTestnet = chainName === 'base-sepolia' || chainName === 'base_sepolia' || chainName === 'sepolia';
  const domain = isTestnet ? 'testnets.opensea.io' : 'opensea.io';
  
  // For testnets we need to use the format /assets/base_sepolia/[contract]/[id]
  // Note: OpenSea uses underscore in the URL (base_sepolia) not dash
  const path = isTestnet 
    ? `assets/${chainName.replace('-', '_')}/${contract}/${tokenId}` 
    : `item/${chainName}/${contract}/${tokenId}`;
    
  const openseaUrl = `https://${domain}/${path}`;

  return (
    <Link 
      href={openseaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${className}`}
    >
      {showIcon && (
        <span className="mr-2">
          <Image 
            src="/opensea-logo.svg" 
            alt="OpenSea" 
            width={16} 
            height={16} 
          />
        </span>
      )}
      {children || `View on OpenSea`}
    </Link>
  );
} 