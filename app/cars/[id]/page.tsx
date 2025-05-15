'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import IPFSImage from '@/app/components/IPFSImage';
import CarActionLayout from '@/app/components/CarActionLayout';
import { useNFTDetails } from '@/app/hooks/useNFTDetails';
import { useUserNFTs } from '@/app/hooks/useUserNFTs';
import { SellNFTForm } from '@/app/components/SellNFTForm';
import Dialog from '@/app/components/Dialog';

// Import ConnectWallet dynamically with SSR disabled to prevent hydration errors
const ConnectWallet = dynamic(
  () => import('@coinbase/onchainkit/wallet').then(mod => mod.ConnectWallet),
  { ssr: false }
);

// Define NFT interface to match the one from useUserNFTs
interface NFT {
  id: string;
  tokenId: string;
  title: string;
  image: string;
  status: string;
  placa: string;
  price?: string;
}

// Sample vehicle data for specific IDs
const SAMPLE_VEHICLES = {
  '1': {
    id: '1',
    tokenId: '1',
    title: 'Toyota Corolla 2022',
    image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    owner: '0x3f9b734394FC1E96afe9523c69d30D227dF4ffca',
    status: 'Owned',
    placa: 'ABC123',
    fechaMatriculaInicial: '01/01/2022',
    marca: 'Toyota',
    linea: 'Corolla',
    modelo: '2022',
    cilindraje: '2000',
    color: 'White',
    servicio: 'Particular',
    claseVehiculo: 'Automóvil',
    tipoCarroceria: 'Sedan',
    combustible: 'Gasolina',
    capacidad: '5 pasajeros',
    numeroMotor: 'MOT123456',
    vin: 'VIN987654321',
    numeroSerie: 'SER12345',
    numeroChasis: 'CHA12345',
  },
  '2': {
    id: '2',
    tokenId: '2',
    title: 'Ford Mustang 2021',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    owner: '0x3f9b734394FC1E96afe9523c69d30D227dF4ffca',
    status: 'Owned',
    placa: 'XYZ789',
    fechaMatriculaInicial: '03/15/2021',
    marca: 'Ford',
    linea: 'Mustang',
    modelo: '2021',
    cilindraje: '5000',
    color: 'Red',
    servicio: 'Particular',
    claseVehiculo: 'Automóvil',
    tipoCarroceria: 'Coupe',
    combustible: 'Gasolina',
    capacidad: '4 pasajeros',
    numeroMotor: 'MUST5432',
    vin: 'FORDVIN7654321',
    numeroSerie: 'FRDSER987',
    numeroChasis: 'FRDCHS765',
  },
  '3': {
    id: '3',
    tokenId: '3',
    title: 'Honda Civic 2023',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2570&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    owner: '0x3f9b734394FC1E96afe9523c69d30D227dF4ffca',
    status: 'Owned',
    placa: 'DEF456',
    fechaMatriculaInicial: '06/10/2023',
    marca: 'Honda',
    linea: 'Civic',
    modelo: '2023',
    cilindraje: '1800',
    color: 'Blue',
    servicio: 'Particular',
    claseVehiculo: 'Automóvil',
    tipoCarroceria: 'Sedan',
    combustible: 'Híbrido',
    capacidad: '5 pasajeros',
    numeroMotor: 'HON9876',
    vin: 'HONVIN123456',
    numeroSerie: 'HONSER543',
    numeroChasis: 'HONCHS321',
  },
  '4': {
    id: '4',
    tokenId: '4',
    title: 'Chevrolet Camaro 2020',
    image: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    owner: '0x3f9b734394FC1E96afe9523c69d30D227dF4ffca',
    status: 'Owned',
    placa: 'GHI789',
    fechaMatriculaInicial: '11/20/2020',
    marca: 'Chevrolet',
    linea: 'Camaro',
    modelo: '2020',
    cilindraje: '6200',
    color: 'Black',
    servicio: 'Particular',
    claseVehiculo: 'Automóvil',
    tipoCarroceria: 'Coupe',
    combustible: 'Gasolina',
    capacidad: '4 pasajeros',
    numeroMotor: 'CHV4321',
    vin: 'CHVVIN987654',
    numeroSerie: 'CHVSER123',
    numeroChasis: 'CHVCHS456',
  },
  '5': {
    id: '5',
    tokenId: '5',
    title: 'Tesla Model 3 2023',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    owner: '0x3f9b734394FC1E96afe9523c69d30D227dF4ffca',
    status: 'Owned',
    placa: 'JKL012',
    fechaMatriculaInicial: '02/05/2023',
    marca: 'Tesla',
    linea: 'Model 3',
    modelo: '2023',
    cilindraje: 'Eléctrico',
    color: 'White',
    servicio: 'Particular',
    claseVehiculo: 'Automóvil',
    tipoCarroceria: 'Sedan',
    combustible: 'Eléctrico',
    capacidad: '5 pasajeros',
    numeroMotor: 'TES5678',
    vin: 'TESVIN123789',
    numeroSerie: 'TESSER456',
    numeroChasis: 'TESCHS789',
  }
};

export default function VehicleDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const { nftDetails, isLoading, error, owner } = useNFTDetails(id);
  const { userNFTs } = useUserNFTs();
  const [currentNFT, setCurrentNFT] = useState<NFT | null>(null);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  
  // State to toggle between real and sample data
  const [useSampleData, setUseSampleData] = useState(false);
  
  // Determine if we should use sample data
  const shouldUseSampleData = useSampleData || 
    (!isLoading && (!nftDetails || error));
  
  // Get sample data for this ID
  const sampleData = SAMPLE_VEHICLES[id as keyof typeof SAMPLE_VEHICLES] || 
    SAMPLE_VEHICLES['1']; // Fallback to first sample if ID not found
  
  // The final vehicle data to display
  const vehicleDetails = shouldUseSampleData ? sampleData : nftDetails;
  
  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find the NFT that matches the ID from the URL
  useEffect(() => {
    if (userNFTs && userNFTs.length > 0) {
      const nft = userNFTs.find(nft => nft.id === params.id || nft.tokenId === params.id);
      if (nft) {
        setCurrentNFT(nft);
      }
    }
  }, [userNFTs, params.id]);

  if (!isMounted) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Vehicle Details</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Vehicle Details</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view vehicle details</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <CarActionLayout title="Vehicle Details">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </CarActionLayout>
    );
  }

  // Check if the current user is the owner of this NFT
  const isOwner = shouldUseSampleData ? 
    true : // Always show as owner for sample data
    owner && address && owner.toLowerCase() === address.toLowerCase();

  // Toggle between real and sample data
  const toggleDataSource = () => {
    setUseSampleData(!useSampleData);
  };

  // Handle successful NFT listing
  const handleSellSuccess = (escrowId: string) => {
    setIsSellDialogOpen(false);
    // Optionally: redirect to a page showing the escrow details
    // router.push(`/cars/trading/${escrowId}`);
  };

  return (
    <CarActionLayout title="Vehicle Details">
      {/* Sample data warning banner */}
      {shouldUseSampleData && (
        <div className="bg-amber-100 dark:bg-amber-900 border border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-200 px-4 py-3 rounded mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-2 sm:mb-0 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div>
                <p className="font-bold">Showing sample data</p>
                {error && <p className="text-sm">Error loading blockchain data: {error}</p>}
              </div>
            </div>
            <button 
              onClick={toggleDataSource}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
            >
              {useSampleData ? 'Try Blockchain Data' : 'Use Sample Data'}
            </button>
          </div>
        </div>
      )}

      {vehicleDetails && (
        <>
          {/* Vehicle Header with Image */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div className="relative h-64 w-full sm:h-96">
              {String(vehicleDetails.image).startsWith('ipfs://') ? (
                <IPFSImage
                  ipfsUri={String(vehicleDetails.image)}
                  alt={String(vehicleDetails.title)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1024px"
                  priority
                />
              ) : (
                <Image 
                  src={vehicleDetails.image} 
                  alt={vehicleDetails.title} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1024px"
                  priority
                />
              )}
              
              <div className="absolute top-0 right-0 p-4 flex flex-col gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Token #{vehicleDetails.tokenId}
                </span>
                {!isOwner && (
                  <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Viewing Only
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Vehicle Title and Plate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {vehicleDetails.title}
            </h2>
            {vehicleDetails.placa && (
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  Plate: {vehicleDetails.placa}
                </span>
              </div>
            )}
          </div>
          
          {/* Vehicle Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Vehicle Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Brand', value: vehicleDetails.marca },
                { label: 'Model', value: vehicleDetails.linea },
                { label: 'Year', value: vehicleDetails.modelo },
                { label: 'Color', value: vehicleDetails.color },
                { label: 'Engine Size', value: vehicleDetails.cilindraje },
                { label: 'Fuel Type', value: vehicleDetails.combustible },
                { label: 'Body Type', value: vehicleDetails.tipoCarroceria },
                { label: 'Capacity', value: vehicleDetails.capacidad },
                { label: 'VIN', value: vehicleDetails.vin },
                { label: 'Engine Number', value: vehicleDetails.numeroMotor },
                { label: 'Chassis Number', value: vehicleDetails.numeroChasis },
                { label: 'First Registration', value: vehicleDetails.fechaMatriculaInicial },
              ].map((item, index) => (
                item.value ? (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ) : null
              ))}
            </div>
          </div>
          
          {/* Blockchain Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Blockchain Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Token ID
                </p>
                <p className="text-gray-900 dark:text-white font-mono">
                  {vehicleDetails.tokenId}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Owner
                </p>
                <p className="text-gray-900 dark:text-white font-mono break-all">
                  {shouldUseSampleData ? vehicleDetails.owner : owner || 'Unknown'}
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href={`https://sepolia.basescan.org/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${vehicleDetails.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <span>View on BaseScan</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Sell button if the user owns this NFT */}
      {isConnected && currentNFT && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsSellDialogOpen(true)}
            className="rounded-lg bg-primary text-white px-6 py-2 font-semibold hover:bg-primary/90"
          >
            Sell This Vehicle
          </button>
        </div>
      )}
      
      {/* Sell Dialog */}
      <Dialog
        isOpen={isSellDialogOpen}
        onClose={() => setIsSellDialogOpen(false)}
        title="Sell Your Vehicle"
      >
        {currentNFT && (
          <SellNFTForm
            tokenId={currentNFT.tokenId || currentNFT.id}
            tokenName={currentNFT.title}
            tokenImage={currentNFT.image}
            onSuccess={handleSellSuccess}
          />
        )}
      </Dialog>
    </CarActionLayout>
  );
} 