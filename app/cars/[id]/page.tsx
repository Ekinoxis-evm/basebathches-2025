'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';

export default function CarDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [carDetails, setCarDetails] = useState<any>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellPrice, setSellPrice] = useState('');
  
  // Mock data for a car - in a real app, this would be fetched from a database or blockchain
  useEffect(() => {
    // Simulate API call to get car details
    const fetchCarDetails = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock car data
        const mockCar = {
          id: id,
          title: `Toyota Corolla 2022 #${id}`,
          image: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          placa: 'ABC123',
          fechaMatriculaInicial: '01/01/2022',
          marca: 'Toyota',
          linea: 'Corolla',
          modelo: '2022',
          cilindraje: '2000',
          color: 'White',
          servicio: 'Particular',
          claseVehiculo: 'Carro',
          tipoCarroceria: 'Sedan',
          combustible: 'Gasolina',
          capacidad: '5 pasajeros',
          numeroMotor: 'MOT123456',
          vin: 'VIN987654321',
          numeroSerie: 'SER12345',
          numeroChasis: 'CHA12345',
          blindaje: 'No',
          declaracionImportacion: 'No',
          propietario: 'William Martinez',
          identificacion: '1234567890',
          status: 'Tokenized',
          tokenId: `#${id}`,
          listed: false,
          price: null,
        };
        
        setCarDetails(mockCar);
      } catch (error) {
        console.error('Error fetching car details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCarDetails();
  }, [id]);

  // Handle selling the car
  const handleSell = () => {
    setShowSellModal(true);
  };
  
  // Handle confirming the sale
  const handleConfirmSell = async () => {
    try {
      // Validate price
      if (!sellPrice || isNaN(parseFloat(sellPrice)) || parseFloat(sellPrice) <= 0) {
        alert('Please enter a valid price');
        return;
      }
      
      // Mock API call to list the car for sale
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setCarDetails({
        ...carDetails,
        listed: true,
        price: sellPrice
      });
      
      // Close modal
      setShowSellModal(false);
      
      // Show success message
      alert(`Your car has been listed for sale at ${sellPrice} ETH`);
      
      // Redirect to trading page
      router.push('/trading');
    } catch (error) {
      console.error('Error listing car for sale:', error);
      alert('There was an error listing your car for sale. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Car Details</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to view car details</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to My Cars
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Car Details</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!carDetails) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to My Cars
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Car Details</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl text-red-600 dark:text-red-400">Car not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to My Cars
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Car Details</h1>
      </div>
      
      {/* Car Header with Image */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="relative h-64 w-full">
          <img 
            src={carDetails.image} 
            alt={carDetails.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h2 className="text-2xl font-bold text-white">{carDetails.title}</h2>
            <p className="text-white">Token ID: {carDetails.tokenId}</p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {carDetails.listed ? 'Listed for Sale' : 'Tokenized'}
            </span>
            {carDetails.listed && (
              <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-white">
                Price: {carDetails.price} ETH
              </p>
            )}
          </div>
          <div className="space-x-3">
            {!carDetails.listed && (
              <button
                onClick={handleSell}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Sell
              </button>
            )}
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
            >
              Transfer
            </button>
          </div>
        </div>
      </div>
      
      {/* Car Details Sections */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Vehicle Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Plate:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.placa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Date:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.fechaMatriculaInicial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.marca}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Model:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.linea} {carDetails.modelo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Engine Size:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.cilindraje} cc</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Color:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.color}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Type:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.servicio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Class:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.claseVehiculo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Body Type:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.tipoCarroceria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuel Type:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.combustible}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.capacidad}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Armored:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.blindaje}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Vehicle Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Engine Number:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.numeroMotor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">VIN:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.vin}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Series Number:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.numeroSerie}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Chassis Number:</span>
              <span className="text-sm text-gray-900 dark:text-white">{carDetails.numeroChasis}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Owner Information</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner:</span>
            <span className="text-sm text-gray-900 dark:text-white">{carDetails.propietario}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Identification:</span>
            <span className="text-sm text-gray-900 dark:text-white">{carDetails.identificacion}</span>
          </div>
        </div>
      </div>
      
      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sell Your Car</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Set a price for your car. This will move it to the trading page and activate the escrow account.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (ETH)
              </label>
              <input 
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSellModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSell}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 