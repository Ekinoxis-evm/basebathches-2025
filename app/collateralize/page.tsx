'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import Image from 'next/image';

// Mock car data
const mockCars = [
  {
    id: '1',
    title: 'Toyota Corolla 2022',
    type: 'Sedan',
    imageUrl: 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tokenId: '123456',
    price: 15000,
    status: 'owned'
  },
  {
    id: '2',
    title: 'Honda CR-V 2021',
    type: 'SUV',
    imageUrl: 'https://images.unsplash.com/photo-1704246125646-cfdf0cb6d2b8?q=80&w=2565&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tokenId: '789012',
    price: 22500,
    status: 'owned'
  }
];

// Mock loan providers
const loanProviders = [
  { id: 'provider1', name: 'DecentralFi', rate: '8.5%', maxLTV: '70%', term: '12 months' },
  { id: 'provider2', name: 'CryptoLoans', rate: '7.2%', maxLTV: '65%', term: '6-24 months' },
  { id: 'provider3', name: 'BlockLend', rate: '9.0%', maxLTV: '75%', term: '3-18 months' }
];

// Componente principal
export default function CollateralizePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CollateralizeContent />
    </Suspense>
  );
}

// Componente con toda la lógica
function CollateralizeContent() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [cars/*, setCars*/] = useState(mockCars);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a car ID in the URL
    const carId = searchParams.get('carId');
    if (carId) {
      setSelectedCar(carId);
    }
  }, [searchParams]);

  const getSelectedCarDetails = () => {
    return cars.find(car => car.id === selectedCar);
  };

  const calculateMaxLoan = () => {
    const car = getSelectedCarDetails();
    if (!car) return 0;
    
    const provider = loanProviders.find(p => p.id === selectedProvider);
    if (!provider) return 0;
    
    const ltv = parseFloat(provider.maxLTV) / 100;
    return car.price * ltv;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCar || !loanAmount || !selectedProvider) {
      alert('Please fill in all fields');
      return;
    }
    
    const maxLoan = calculateMaxLoan();
    if (parseFloat(loanAmount) > maxLoan) {
      alert(`Loan amount exceeds maximum allowed (${maxLoan.toFixed(2)} USD)`);
      return;
    }
    
    setSubmitStatus('processing');
    
    try {
      // Here would be the actual loan processing logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Get a Loan with Your Car</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Connect your wallet to apply for a loan</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Loan Request Submitted</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">Loan Request Successful!</p>
            <p>Your loan request has been submitted and is being processed. You will receive confirmation soon.</p>
          </div>
          <div className="flex flex-col space-y-4 items-center">
            <Link href="/profile" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              View My Profile
            </Link>
            <Link href="/cars" className="text-blue-600 dark:text-blue-400 hover:underline">
              Back to My Cars
            </Link>
          </div>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Get a Loan with Your Car</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Select one of your tokenized vehicles as collateral</li>
          <li>Choose a loan provider and specify the loan amount</li>
          <li>Your vehicle NFT will be locked in a smart contract during the loan period</li>
          <li>Repay the loan to retrieve your vehicle NFT, or default and lose ownership</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Car */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Select Collateral</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cars.map(car => (
              <div 
                key={car.id} 
                className={`border p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedCar === car.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
                onClick={() => setSelectedCar(car.id)}
              >
                <div className="flex">
                  <div className="w-24 h-24 mr-4 overflow-hidden rounded">
                    <Image 
                      src={car.imageUrl} 
                      alt={car.title} 
                      className="w-full h-full object-cover"
                      width={96} // Set appropriate width (24 * 4 = 96px)
                      height={96} // Set appropriate height (24 * 4 = 96px)
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{car.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{car.type}</p>
                    <p className="text-sm text-gray-900 dark:text-gray-200 font-medium mt-1">Value: ${car.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Token ID: {car.tokenId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Loan Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Provider
              </label>
              <select 
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a provider</option>
                {loanProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.rate} interest, up to {provider.maxLTV} LTV
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Amount (USD)
              </label>
              <input 
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter loan amount"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {selectedCar && selectedProvider && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maximum loan amount: ${calculateMaxLoan().toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedCar && selectedProvider && loanAmount && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Loan Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Collateral:</span>
                <span className="text-gray-900 dark:text-white">{getSelectedCarDetails()?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Collateral Value:</span>
                <span className="text-gray-900 dark:text-white">${getSelectedCarDetails()?.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Loan Provider:</span>
                <span className="text-gray-900 dark:text-white">
                  {loanProviders.find(p => p.id === selectedProvider)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                <span className="text-gray-900 dark:text-white">
                  {loanProviders.find(p => p.id === selectedProvider)?.rate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Loan Term:</span>
                <span className="text-gray-900 dark:text-white">
                  {loanProviders.find(p => p.id === selectedProvider)?.term}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span className="text-gray-800 dark:text-gray-200">Loan Amount:</span>
                <span className="text-gray-900 dark:text-white">${parseFloat(loanAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!selectedCar || !loanAmount || !selectedProvider || submitStatus === 'processing'}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitStatus === 'processing' ? 'Processing...' : 'Apply for Loan'}
          </button>
        </div>
        
        {submitStatus === 'error' && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mt-4">
            <p className="font-bold">Error processing loan request</p>
            <p>Please try again later or contact support.</p>
          </div>
        )}
      </form>
    </div>
  );
}