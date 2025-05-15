'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useVehicleNFTV2 } from '@/app/hooks/useVehicleNFTV2';
import Image from 'next/image';
import Link from 'next/link';
import CarActionLayout from '@/app/components/CarActionLayout';

export default function SimpleMintPage() {
  const { address } = useAccount();
  const { 
    smartMintVehicleNFT, 
    isContractOwner, 
    error, 
    transactionHash, 
    transactionUrl 
  } = useVehicleNFTV2();
  
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'minting' | 'success' | 'error'>('idle');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null,
    imagePreview: null as string | null,
  });
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.description) {
      alert('Please fill out all required fields');
      return;
    }
    
    try {
      setStatus('uploading');
      
      // Prepare metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        attributes: [
          { trait_type: 'Created By', value: address }
        ]
      };
      
      // Upload to IPFS
      const uploadData = new FormData();
      if (formData.image) {
        uploadData.append('image', formData.image);
      }
      uploadData.append('metadata', JSON.stringify(metadata));
      uploadData.append('placa', formData.name); // Using name as placa for simplicity
      
      const response = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: uploadData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload to IPFS');
      }
      
      const { metadataUri, warning } = await response.json();
      
      if (warning) {
        console.warn('IPFS Upload Warning:', warning);
      }
      
      // Mint the NFT using the smart minting function
      setStatus('minting');
      console.log('Starting NFT minting with metadataUri:', metadataUri);
      console.log('Is contract owner:', isContractOwner());
      
      await smartMintVehicleNFT({
        tokenMetadata: { uri: metadataUri }
      });
      
      setStatus('success');
    } catch (error) {
      setStatus('error');
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError('An unknown error occurred');
      }
      console.error('Error during minting:', error);
    }
  };
  
  // If minting was successful
  if (status === 'success') {
    return (
      <CarActionLayout title="Simple NFT Minting" showWalletInfo={false}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">Minting Successful!</p>
            <p>Your NFT has been minted and will appear in your collection soon.</p>
          </div>
          {transactionUrl && (
            <div className="mb-6 text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-2">Transaction:</p>
              <a 
                href={transactionUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {transactionHash}
              </a>
            </div>
          )}
          <div className="flex justify-center">
            <Link href="/cars" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              View My Vehicles
            </Link>
          </div>
        </div>
      </CarActionLayout>
    );
  }
  
  // Show error message if minting failed
  if (status === 'error') {
    return (
      <CarActionLayout title="Simple NFT Minting" showWalletInfo={false}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error during minting</p>
            <p>{uploadError || error?.message || 'An unexpected error occurred during the minting process.'}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setStatus('idle')} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
            <Link href="/cars" className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </Link>
          </div>
        </div>
      </CarActionLayout>
    );
  }
  
  // Main form
  return (
    <CarActionLayout title="Simple NFT Minting" showWalletInfo={true}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 rounded">
          <p className="font-medium">Smart Minting System</p>
          <p>This page uses a smart minting approach that automatically selects the best method to mint your NFT based on your wallet.</p>
          {isContractOwner() && (
            <p className="mt-2 text-green-700 dark:text-green-300">You are connected with the contract owner wallet. Owner minting will be used.</p>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NFT Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NFT Image
            </label>
            <div className="mt-1 flex flex-col items-center">
              {formData.imagePreview ? (
                <div className="mb-4 relative">
                  <Image 
                    src={formData.imagePreview} 
                    alt="NFT Preview" 
                    width={300}
                    height={200}
                    className="rounded-lg shadow-md"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div 
                  className="mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-lg flex flex-col items-center justify-center w-full max-w-sm h-48 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                  onClick={() => document.getElementById('nft-image')?.click()}
                >
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Click to upload an image</p>
                </div>
              )}
              
              <input
                type="file"
                id="nft-image"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              <label 
                htmlFor="nft-image"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                {formData.imagePreview ? 'Change Image' : 'Select Image'}
              </label>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={status === 'uploading' || status === 'minting'}
              className={`px-4 py-2 ${
                status === 'uploading' || status === 'minting'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-medium rounded-lg transition-colors flex items-center`}
            >
              {status === 'uploading' || status === 'minting' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {status === 'uploading' ? 'Uploading...' : 'Minting...'}
                </>
              ) : (
                'Mint NFT'
              )}
            </button>
          </div>
        </form>
      </div>
    </CarActionLayout>
  );
} 