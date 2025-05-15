'use client';

import { useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import Link from 'next/link';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useVehicleNFTV2 } from '@/app/hooks/useVehicleNFTV2';
import Image from 'next/image';
import ImageGuidelines from './ImageGuidelines';

// Define types for formData
type VehicleBasicInfo = {
  placa: string;
  marca: string;
  linea: string;
  modelo: string;
  color: string;
  vin: string;
  title: string;
  description: string;
};

type NFTSettings = {
  price: string;
  paymentToken: string;
  image: File | null;
  imagePreview: string | null;
};

type FormData = {
  vehicleInfo: VehicleBasicInfo;
  nftSettings: NFTSettings;
  aceptaTerminos: boolean;
};

export default function TokenizePage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isCorrectNetwork = chainId === baseSepolia.id;
  
  // Check if the connected wallet is the contract owner
  const isOwner = address?.toLowerCase() === '0x3f9b734394FC1E96afe9523c69d30D227dF4ffca'.toLowerCase();

  // Use the updated vehicle NFT V2 hook
  const { 
    mintVehicleNFT,
    publicMintVehicleNFT, 
    isLoading: isMinting, 
    error: mintError, 
    transactionHash,
    transactionUrl,
    isOnCorrectChain,
    ensureCorrectChain
  } = useVehicleNFTV2();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [networkSwitchInProgress, setNetworkSwitchInProgress] = useState(false);
  
  // Step tracking for two-step form
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Available payment tokens
  const paymentTokens = [
    { name: 'ETH', label: 'Ethereum (ETH)' },
    { name: 'USDC', label: 'USD Coin (USDC)' },
    { name: 'USDT', label: 'Tether (USDT)' }
  ];

  // Available car brands
  const carBrands = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 
    'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 
    'Kia', 'Mazda', 'Subaru', 'Lexus', 'Jeep', 'Tesla'
  ];

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    vehicleInfo: {
      placa: '',
      marca: '',
      linea: '',
      modelo: '',
      color: '',
      vin: '',
      title: '',
      description: '',
    },
    nftSettings: {
      price: '',
      paymentToken: 'ETH',
      image: null,
      imagePreview: null,
    },
    aceptaTerminos: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  // Handler for form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section: 'vehicleInfo' | 'nftSettings'
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    setFormData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
    
    if (errors[`${section}.${name}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${name}`];
        return newErrors;
      });
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      setFormData((prevData) => ({
        ...prevData,
        nftSettings: {
          ...prevData.nftSettings,
          image: file,
          imagePreview: URL.createObjectURL(file),
        },
      }));
      
      if (errors['nftSettings.image']) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors['nftSettings.image'];
          return newErrors;
        });
      }
    }
  };

  // Validate form data for current step
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      // Validate vehicle info fields
      if (!formData.vehicleInfo.title) {
        newErrors['vehicleInfo.title'] = 'El título del NFT es requerido';
      }
      if (!formData.vehicleInfo.description) {
        newErrors['vehicleInfo.description'] = 'La descripción del NFT es requerida';
      }
      if (!formData.vehicleInfo.placa) {
        newErrors['vehicleInfo.placa'] = 'La placa es requerida';
      }
      if (!formData.vehicleInfo.marca) {
        newErrors['vehicleInfo.marca'] = 'La marca es requerida';
      }
      if (!formData.vehicleInfo.linea) {
        newErrors['vehicleInfo.linea'] = 'La línea es requerida';
      }
      if (!formData.vehicleInfo.modelo) {
        newErrors['vehicleInfo.modelo'] = 'El modelo es requerido';
      }
      if (!formData.vehicleInfo.color) {
        newErrors['vehicleInfo.color'] = 'El color es requerido';
      }
      if (!formData.vehicleInfo.vin) {
        newErrors['vehicleInfo.vin'] = 'El VIN es requerido';
      } else if (formData.vehicleInfo.vin.length !== 17) {
        newErrors['vehicleInfo.vin'] = 'El VIN debe tener exactamente 17 caracteres';
      }
    } else if (currentStep === 2) {
      // Validate NFT settings
      if (!formData.nftSettings.price) {
        newErrors['nftSettings.price'] = 'El precio es requerido';
      } else if (isNaN(parseFloat(formData.nftSettings.price)) || parseFloat(formData.nftSettings.price) <= 0) {
        newErrors['nftSettings.price'] = 'El precio debe ser un número positivo';
      }
      
      if (!formData.nftSettings.paymentToken) {
        newErrors['nftSettings.paymentToken'] = 'Debes seleccionar un token de pago';
      }
      
      if (formData.aceptaTerminos === false) {
        newErrors['aceptaTerminos'] = 'Debes aceptar los términos y condiciones';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Move to next step
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  // Move to previous step
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Function to handle network switching
  const handleNetworkSwitch = async () => {
    try {
      setNetworkSwitchInProgress(true);
      await switchChain({ chainId: baseSepolia.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      
      // Show user-friendly error
      let errorMessage = 'No se pudo cambiar a la red Base Sepolia. Por favor, cambia la red manualmente en tu wallet.';
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          errorMessage = 'Cambio de red rechazado. Por favor, acepta el cambio de red para poder tokenizar vehículos.';
        }
      }
      setUploadError(errorMessage);
    } finally {
      setNetworkSwitchInProgress(false);
    }
  };

  // Form submission handler
  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if on correct network first
    if (!isCorrectNetwork) {
      setUploadError('Para tokenizar vehículos, debes usar la red Base Sepolia.');
      return;
    }

    // Validate all fields
    if (!validateCurrentStep()) {
      return;
    }

    setSubmitStatus('processing');
    setIsUploading(true);
    setUploadError(null);

    try {
      // Step 1: Prepare metadata JSON
      const metadata = {
        name: formData.vehicleInfo.title || `${formData.vehicleInfo.marca} ${formData.vehicleInfo.linea}`,
        description: formData.vehicleInfo.description || `${formData.vehicleInfo.marca} ${formData.vehicleInfo.linea} ${formData.vehicleInfo.modelo}`,
        price: formData.nftSettings.price,
        paymentToken: formData.nftSettings.paymentToken,
        attributes: [
          { trait_type: 'Placa', value: formData.vehicleInfo.placa },
          { trait_type: 'Marca', value: formData.vehicleInfo.marca },
          { trait_type: 'Linea', value: formData.vehicleInfo.linea },
          { trait_type: 'Modelo', value: formData.vehicleInfo.modelo },
          { trait_type: 'Color', value: formData.vehicleInfo.color },
          { trait_type: 'VIN', value: formData.vehicleInfo.vin },
          { trait_type: 'Precio', value: formData.nftSettings.price },
          { trait_type: 'Token', value: formData.nftSettings.paymentToken },
        ],
      };

      // Step 2: Upload to IPFS via API route
      const uploadFormData = new FormData();
      
      // Add image if available
      if (formData.nftSettings.image) {
        uploadFormData.append('image', formData.nftSettings.image);
      }
      
      uploadFormData.append('metadata', JSON.stringify(metadata));
      uploadFormData.append('placa', formData.vehicleInfo.placa);

      const response = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: uploadFormData,
      });

      setIsUploading(false);

      if (!response.ok) {
        const errorData = await response.json();
        setUploadError(errorData.error || 'Error al subir a IPFS');
        setSubmitStatus('error');
        return;
      }

      const { metadataUri, warning } = await response.json();
      
      if (warning) {
        console.warn('IPFS Upload Warning:', warning);
      }

      // Try both minting methods (first owner method, then public method if that fails)
      try {
        console.log("Connected wallet is owner:", isOwner);
        console.log("Wallet address:", address);
        
        if (isOwner) {
          console.log("Using owner minting method...");
          await mintVehicleNFT({
            tokenMetadata: { uri: metadataUri },
          });
        } else {
          console.log("Using public minting method...");
          await publicMintVehicleNFT({
            tokenMetadata: { uri: metadataUri },
          });
        }
        
        // If we got here without an error, the transaction was successful
        setSubmitStatus('success');
      } catch (mintError) {
        console.error("Minting failed:", mintError);
        
        // Check for user rejection error message patterns across different wallets
        const errorMessage = mintError instanceof Error ? mintError.message.toLowerCase() : '';
        if (
          errorMessage.includes('user rejected') || 
          errorMessage.includes('user denied') || 
          errorMessage.includes('user cancelled') ||
          errorMessage.includes('user canceled') ||
          errorMessage.includes('rejected') ||
          errorMessage.includes('denied transaction') ||
          errorMessage.includes('transaction was rejected')
        ) {
          setUploadError('Transacción cancelada: El usuario rechazó la firma de la transacción');
        } else {
          setUploadError(mintError instanceof Error ? mintError.message : 'Error en el proceso de minteo');
        }
        
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error durante la tokenización:', error);
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError('Ocurrió un error desconocido');
      }
    }
  };

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Tokenizar Tu Vehículo</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl mb-4 text-gray-700 dark:text-gray-300">Conecta tu wallet para tokenizar tu vehículo</h2>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }
  
  // Show owner admin panel link if the connected wallet is the contract owner
  if (isOwner) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Wallet de Propietario Detectada</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">¡Wallet del Contrato Detectada!</p>
            <p>Has conectado con la wallet del propietario del contrato: {address}</p>
          </div>
          <p className="mb-6 text-gray-700 dark:text-gray-300">
            Como propietario del contrato, puedes usar el panel de administración para autorizar direcciones para el minteo.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/admin/owner" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Ir al Panel de Administración
            </Link>
            <Link href="/cars" className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
              Volver a Mis Vehículos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If submission was successful
  if (submitStatus === 'success') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver a Mis Vehículos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tokenizar Tu Vehículo</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">¡Tokenización Exitosa!</p>
            <p>Tu vehículo ha sido tokenizado. Ahora puedes verlo en tu colección.</p>
          </div>
          {transactionUrl && (
            <div className="mb-6 text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-2">Transacción:</p>
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
              Ver Mis Vehículos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if submission failed
  if (submitStatus === 'error') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/cars" className="mr-4 text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver a Mis Vehículos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tokenizar Tu Vehículo</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error durante la tokenización</p>
            <p>{uploadError || mintError?.message || 'Ocurrió un error inesperado durante el proceso de tokenización.'}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setSubmitStatus(null)} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Intentar Nuevamente
            </button>
            <Link href="/cars" className="px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
              Cancelar
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
          ← Volver a Mis Vehículos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tokenizar Tu Vehículo</h1>
      </div>
      
      {/* Network Warning Banner */}
      {isConnected && !isCorrectNetwork && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="font-bold">Red incorrecta detectada</p>
              <p>Para tokenizar vehículos, debes usar la red Base Sepolia.</p>
            </div>
            <button 
              onClick={handleNetworkSwitch}
              disabled={networkSwitchInProgress}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-400"
            >
              {networkSwitchInProgress ? 'Cambiando...' : 'Cambiar a Base Sepolia'}
            </button>
          </div>
        </div>
      )}
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`rounded-full h-10 w-10 flex items-center justify-center ${
                currentStep > index + 1
                  ? 'bg-green-500 text-white'
                  : currentStep === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={onFormSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
          Para tokenizar tu vehículo necesitarás proporcionar la información básica del mismo.
        </p>
        
        {/* Step 1: Basic Vehicle Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Información del NFT</h3>
            
            {/* NFT Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título del NFT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.vehicleInfo.title}
                onChange={(e) => handleChange(e, 'vehicleInfo')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ej: Toyota Corolla 2022 - Edición Especial"
              />
              {errors['vehicleInfo.title'] && (
                <p className="mt-1 text-sm text-red-500">{errors['vehicleInfo.title']}</p>
              )}
            </div>
            
            {/* NFT Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción del NFT <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.vehicleInfo.description}
                onChange={(e) => handleChange(e, 'vehicleInfo')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Describe las características y estado del vehículo"
              />
              {errors['vehicleInfo.description'] && (
                <p className="mt-1 text-sm text-red-500">{errors['vehicleInfo.description']}</p>
              )}
            </div>
            
            <h3 className="text-xl font-bold mb-4 mt-6">Información del Vehículo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Placa *
                </label>
                <input
                  type="text"
                  name="placa"
                  value={formData.vehicleInfo.placa}
                  onChange={(e) => handleChange(e, 'vehicleInfo')}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors['vehicleInfo.placa'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['vehicleInfo.placa']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marca *
                </label>
                <select
                  name="marca"
                  value={formData.vehicleInfo.marca}
                  onChange={(e) => handleChange(e, 'vehicleInfo')}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione marca</option>
                  {carBrands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                {errors['vehicleInfo.marca'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['vehicleInfo.marca']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Línea (modelo específico) *
                </label>
                <input
                  type="text"
                  name="linea"
                  value={formData.vehicleInfo.linea}
                  onChange={(e) => handleChange(e, 'vehicleInfo')}
                  placeholder="Ej. Corolla, Civic, F-150"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors['vehicleInfo.linea'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['vehicleInfo.linea']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo (Año) *
                </label>
                <input
                  type="number"
                  name="modelo"
                  value={formData.vehicleInfo.modelo}
                  onChange={(e) => handleChange(e, 'vehicleInfo')}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors['vehicleInfo.modelo'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['vehicleInfo.modelo']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.vehicleInfo.color}
                  onChange={(e) => handleChange(e, 'vehicleInfo')}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors['vehicleInfo.color'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['vehicleInfo.color']}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  VIN (Número de Identificación del Vehículo) *
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vehicleInfo.vin}
                  onChange={(e) => handleChange(e, 'vehicleInfo')}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">El VIN debe tener 17 caracteres.</p>
                {errors['vehicleInfo.vin'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['vehicleInfo.vin']}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: NFT Settings & Image Upload */}
        {currentStep === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Configuración del NFT</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Configura el precio y sube una imagen para tu NFT.
            </p>
            
            {/* NFT Price Settings */}
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Precio</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.000001"
                    min="0"
                    value={formData.nftSettings.price}
                    onChange={(e) => handleChange(e, 'nftSettings')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['nftSettings.price'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['nftSettings.price']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Token de Pago *
                  </label>
                  <select
                    name="paymentToken"
                    value={formData.nftSettings.paymentToken}
                    onChange={(e) => handleChange(e, 'nftSettings')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {paymentTokens.map((token) => (
                      <option key={token.name} value={token.name}>
                        {token.label}
                      </option>
                    ))}
                  </select>
                  {errors['nftSettings.paymentToken'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['nftSettings.paymentToken']}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* NFT Image Upload */}
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">Imagen del NFT</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sube una imagen que represente tu vehículo. Esta imagen será visible en la plataforma y marketplace.
              </p>
              
              <ImageGuidelines />
              
              <div className="flex flex-col items-center justify-center">
                {formData.nftSettings.imagePreview ? (
                  <div className="mb-4 relative">
                    <Image 
                      src={formData.nftSettings.imagePreview} 
                      alt="NFT Preview" 
                      width={300}
                      height={200}
                      className="rounded-lg shadow-md"
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        nftSettings: {
                          ...prev.nftSettings,
                          image: null,
                          imagePreview: null
                        }
                      }))}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Arrastra una imagen o haz clic para seleccionar</p>
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
                  {formData.nftSettings.imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </label>
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div className="mt-6">
              <div className="flex items-center">
                <input
                  id="aceptaTerminos"
                  type="checkbox"
                  checked={formData.aceptaTerminos}
                  onChange={(e) => setFormData(prev => ({ ...prev, aceptaTerminos: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="aceptaTerminos" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Acepto los términos y condiciones para la tokenización del vehículo
                </label>
              </div>
              {errors['aceptaTerminos'] && (
                <p className="text-red-500 text-xs mt-1">{errors['aceptaTerminos']}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Submit button at bottom of form */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Anterior
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${
                currentStep === 1 && 'ml-auto'
              }`}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
              disabled={isUploading || isMinting}
            >
              {(isUploading || isMinting) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isUploading ? 'Subiendo a IPFS...' : 'Tokenizando...'}
                </>
              ) : (
                'Tokenizar Vehículo'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}