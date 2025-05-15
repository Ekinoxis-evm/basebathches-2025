'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface NFTCardProps {
  title: string;
  tokenId: string;
  contractAddress: string;
  description?: string;
  placa?: string;
  imageUrl?: string;
  onClick?: () => void;
  href?: string;
}

export default function NFTCard({ 
  title, 
  tokenId, 
  contractAddress,
  description,
  placa,
  imageUrl,
  onClick,
  href
}: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use a default image if none is provided
  const fallbackImage = "https://images.unsplash.com/photo-1577020091918-c2a0f8c9deca?q=80&w=1000&auto=format&fit=crop";
  const displayImage = imageUrl || fallbackImage;
  
  // Format contract address for display
  const shortenedAddress = contractAddress ? 
    `${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}` : 
    '';

  // Generate href if not provided
  const detailsHref = href || `/cars/${tokenId}`;

  // Card content to be wrapped with either Link or div
  const CardContent = (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${isHovered ? 'shadow-2xl transform scale-[1.02]' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header with Basic Info */}
      <div className="bg-blue-600 text-white p-4">
        <h3 className="text-lg font-semibold truncate">{title}</h3>
        <div className="flex justify-between items-center mt-1">
          <span className="bg-blue-800 px-2 py-1 rounded-full text-xs">
            Token #{tokenId}
          </span>
          {placa && (
            <span className="bg-green-800 px-2 py-1 rounded-full text-xs">
              Plate: {placa}
            </span>
          )}
        </div>
      </div>
      
      {/* Optional Image - Smaller Height */}
      {displayImage && (
        <div className="relative h-40 w-full">
          <Image 
            src={displayImage} 
            alt={title} 
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      {/* Details Section */}
      <div className="p-4 bg-white dark:bg-gray-800 space-y-2">
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Contract:</span> {shortenedAddress}
          </p>
        </div>
        
        <div className="flex justify-end mt-2">
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  // If there's an onClick handler, don't wrap with Link (let the handler do its job)
  // Otherwise wrap with Link for direct navigation
  return onClick ? CardContent : (
    <Link href={detailsHref}>
      {CardContent}
    </Link>
  );
} 