'use client';

import { useState } from 'react';
import IPFSImage from './IPFSImage';
import Image from 'next/image';

interface NFTImageCardProps {
  imageUri: string;
  title: string;
  tokenId: string;
  placa?: string;
  onClick?: () => void;
  showFullDetails?: boolean;
}

export default function NFTImageCard({ 
  imageUri, 
  title, 
  tokenId, 
  placa, 
  onClick, 
  showFullDetails = false
}: NFTImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine if image is from IPFS
  const isIPFS = imageUri?.startsWith('ipfs://');

  return (
    <div 
      className={`relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      } ${isHovered ? 'shadow-2xl transform scale-[1.02]' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* NFT Image */}
      <div className="relative h-64 w-full">
        {isIPFS ? (
          <IPFSImage
            ipfsUri={imageUri}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
            objectFit="cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={imageUri} 
              alt={title} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* TokenID badge */}
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div className="flex justify-end">
            {tokenId && (
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Token #{tokenId}
              </span>
            )}
          </div>
        </div>
        
        {/* Hover overlay with gradient */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
      
      {/* NFT Details */}
      <div className="p-4 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {title}
        </h3>
        
        {showFullDetails ? (
          <div className="space-y-2">
            {placa && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Plate:</span> {placa}
              </p>
            )}
            
            <div className="mt-4 flex space-x-2">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                View Details
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            {placa && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Plate:</span> {placa}
              </p>
            )}
            
            <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 