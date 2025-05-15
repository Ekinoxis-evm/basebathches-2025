import Link from 'next/link';
import Image from 'next/image';
import { CONTRACT_ADDRESSES } from '../../contracts/config';

// Format contract address if needed
const formatAddress = (address: string) => {
  if (address.startsWith('0x')) {
    return address.toLowerCase();
  }
  return `0x${address}`.toLowerCase();
};

type BaseScanLinkProps = {
  tokenId: string | number;
  contractAddress?: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
};

export default function BaseScanLink({ 
  tokenId, 
  contractAddress,
  children, 
  className = '',
  showIcon = true
}: BaseScanLinkProps) {
  // Use provided contract address or default to the NFT contract from config
  const contract = contractAddress 
    ? formatAddress(contractAddress)
    : formatAddress(CONTRACT_ADDRESSES.VehicleNFT_V2 || '');
    
  // Format BaseScan URL - always using sepolia.basescan.org for testnet
  const baseScanUrl = `https://sepolia.basescan.org/nft/${contract}/${tokenId}`;

  return (
    <Link 
      href={baseScanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${className}`}
    >
      {showIcon && (
        <span className="mr-2">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="inline-block"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z"
              fill="currentColor"
            />
          </svg>
        </span>
      )}
      {children || `View on BaseScan`}
    </Link>
  );
} 