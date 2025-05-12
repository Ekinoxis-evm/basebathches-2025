  'use client';

  import { useState, useEffect } from 'react';
  import { useAccount } from 'wagmi';
  import { useRouter } from 'next/navigation';
  import Link from 'next/link';
  import { ConnectWallet } from '@coinbase/onchainkit/wallet';

  import { uploadImageToIPFS } from '../../lib/ipfs/pinata';
  import { generateAndUploadMetadata } from '../../lib/utils/generateVehicleMetadata';
  import { mintVehicleNFT } from '../../lib/web3/mintVehicle';



  export default function TokenizePage() {
    const { isConnected } = useAccount();
    const router = useRouter();

    // Mock user profile data (in a real app, this would be fetched from a database)
    const [userProfile, setUserProfile] = useState({
      fullName: 'William Martinez',
      identificationType: 'Cedula de ciudadania',
      identificationNumber: '1234567890'
    });
    
    // Step tracking for multi-step form
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 7;
    
    // Form data state
    const [formData, setFormData] = useState({
      // Step 1: Owner Information (not stored in NFT metadata)
      propietario: {
        nombreCompleto: '',
        tipoDocumento: '',
        numeroDocumento: '',
      },
      
      // Step 2: Vehicle Information (stored in NFT metadata)
      vehiculo: {
        placa: '',
        fechaMatriculaInicial: '',
        marca: '',
        linea: '',
        modelo: '',
        cilindraje: '',
        color: '',
        servicio: '',
        claseVehiculo: '',
        tipoCarroceria: '',
        combustible: '',
        capacidad: '',
        numeroMotor: '',
        vin: '',
        numeroSerie: '',
        numeroChasis: '',
        blindaje: '',
        declaracionImportacion: '',
        fechaImportacion: '',
      },
      
      // Step 3: Vehicle Location (not stored in NFT metadata)
      ubicacion: {
        estado: '',
        kilometraje: '',
        contactoCelular: '',
        departamento: '',
        ciudad: '',
      },
      
      // Step 4: SOAT Information (not stored in NFT metadata)
      soat: {
        entidad: '',
        numeroPoliza: '',
        fechaExpedicion: '',
        fechaInicioVigencia: '',
        vigente: false,
      },
      
      // Step 5: Technical Mechanical Information (not stored in NFT metadata)
      tecnicoMecanica: {
        cda: '',
        numeroCertificado: '',
        fechaExpedicion: '',
        fechaVigencia: '',
        vigente: false,
      },
      
      // Step 6: Expert Assessment (not stored in NFT metadata)
      peritaje: {
        tienePenitaje: false,
        entidadEmisora: '',
        archivo: null,
      },
      
      // Step 7: Insurance Information (not stored in NFT metadata)
      seguro: {
        entidadAseguradora: '',
        numeroPoliza: '',
        fechaExpedicion: '',
        fechaInicioVigencia: '',
        vigente: false
      },
      
      aceptaTerminos: false,
    });

    // Selection options for various fields
    const tiposDocumento = ['Cedula de ciudadania', 'Cedula extranjeria', 'NIT'];
    const tiposServicio = ['Particular', 'Público'];
    const clasesVehiculo = ['Carro', 'Motocicleta', 'Camioneta'];
    const tiposCarroceria = ['SIN CARROCERIA', 'CON CARROCERIA'];
    const tiposCombustible = ['Gasolina', 'Diesel', 'Eléctrico', 'Híbrido', 'Gas'];
    const opcionesSiNo = ['Si', 'No'];
    const estadosVehiculo = ['Nuevo', 'Usado'];
    
    // Colombian departments and cities
    const departamentos = [
      'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 
      'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 
      'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 
      'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 
      'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 
      'Valle del Cauca', 'Vaupés', 'Vichada'
    ];
    
    // Mock car brands by type
    const marcasPorTipo = {
      'Carro': ['Toyota', 'Chevrolet', 'Mazda', 'Renault', 'Ford', 'Nissan', 'Kia', 'Hyundai'],
      'Motocicleta': ['Yamaha', 'Honda', 'Suzuki', 'Kawasaki', 'Bajaj', 'KTM', 'Royal Enfield'],
      'Camioneta': ['Toyota', 'Ford', 'Chevrolet', 'Nissan', 'Mitsubishi', 'Jeep', 'Kia', 'Hyundai']
    };
    
    // State for errors
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitStatus, setSubmitStatus] = useState<string | null>(null);
    
    // Effect to populate owner information
    useEffect(() => {
      // Pre-fill owner information from user profile
      setFormData(prev => ({
        ...prev,
        propietario: {
          nombreCompleto: userProfile.fullName,
          tipoDocumento: userProfile.identificationType,
          numeroDocumento: userProfile.identificationNumber
        }
      }));
    }, [userProfile]);
    
    // Handler for form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, section: string) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      
      setFormData(prevData => ({
        ...prevData,
        [section]: {
          ...prevData[section as keyof typeof prevData] as Record<string, any>,
          [name]: type === 'checkbox' ? checked : value
        }
      }));
      
      // Clear error for this field if it exists
      if (errors[`${section}.${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${section}.${name}`];
          return newErrors;
        });
      }
    };
    
    // Handle file uploads
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setFormData(prevData => ({
          ...prevData,
          [section]: {
            ...prevData[section as keyof typeof prevData] as Record<string, any>,
            [field]: file
          }
        }));
      }
    };
    
    // Helper function to check if date is valid
    const isValidDate = (dateString: string) => {
      if (!dateString) return false;
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!regex.test(dateString)) return false;
      
      const [day, month, year] = dateString.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && 
            date.getMonth() === month - 1 && 
            date.getFullYear() === year;
    };
    
    // Validate form data for current step
    const validateCurrentStep = () => {
      const newErrors: Record<string, string> = {};
      
      // Step 1: Owner Information validation
      if (currentStep === 1) {
        const { nombreCompleto, tipoDocumento, numeroDocumento } = formData.propietario;
        
        if (!nombreCompleto) {
          newErrors['propietario.nombreCompleto'] = 'El nombre completo es obligatorio';
        } else if (nombreCompleto !== userProfile.fullName) {
          newErrors['propietario.nombreCompleto'] = 'El nombre debe coincidir con el perfil del usuario';
        }
        
        if (!tipoDocumento) {
          newErrors['propietario.tipoDocumento'] = 'El tipo de documento es obligatorio';
        }
        
        if (!numeroDocumento) {
          newErrors['propietario.numeroDocumento'] = 'El número de documento es obligatorio';
        } else if (numeroDocumento !== userProfile.identificationNumber) {
          newErrors['propietario.numeroDocumento'] = 'El número de documento no coincide con el perfil del usuario';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    // Move to next step
    const nextStep = () => {
      if (validateCurrentStep()) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      }
    };
    
    // Move to previous step
    const prevStep = () => {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    };
    
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
    
      // Validación de identidad
      if (
        formData.propietario.nombreCompleto !== userProfile.fullName ||
        formData.propietario.numeroDocumento !== userProfile.identificationNumber
      ) {
        setErrors({
          identity: 'No eres el propietario, no puedes tokenizar este vehículo'
        });
        return;
      }
    
      setSubmitStatus('processing');
    
      try {
        // 1. Subir imagen del peritaje (si existe)
        let imageUrl = '';
        if (formData.peritaje.archivo) {
          imageUrl = await uploadImageToIPFS(formData.peritaje.archivo);
        }
    
        // 2. Generar metadata + subir a IPFS
        const metadataUrl = await generateAndUploadMetadata(formData.vehiculo, imageUrl);
    
        // 3. Obtener dirección del usuario conectado
        const { address } = useAccount();
        if (!address) {
          throw new Error('Wallet no conectada');
        }
    
        // 4. Ejecutar minteo del NFT
        const result = await mintVehicleNFT(metadataUrl, address);
        console.log('Mint result:', result);
    
        setSubmitStatus('success');
      } catch (error) {
        console.error('Error procesando la tokenización:', error);
        setSubmitStatus('error');
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
            <div className="flex justify-center">
              <Link href="/cars" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Ver Mis Vehículos
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
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
            Para este proceso es importante que tenga la tarjeta de propiedad del vehículo a la mano.
          </p>
          
          {errors['identity'] && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              <p className="font-bold">{errors['identity']}</p>
            </div>
          )}
          
          {/* Step 1: Owner Information */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Propietario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input 
                    type="text"
                    name="nombreCompleto"
                    value={formData.propietario.nombreCompleto}
                    onChange={(e) => handleChange(e, 'propietario')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['propietario.nombreCompleto'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['propietario.nombreCompleto']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Documento *
                  </label>
                  <select 
                    name="tipoDocumento"
                    value={formData.propietario.tipoDocumento}
                    onChange={(e) => handleChange(e, 'propietario')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione tipo de documento</option>
                    {tiposDocumento.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  {errors['propietario.tipoDocumento'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['propietario.tipoDocumento']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Documento *
                  </label>
                  <input 
                    type="text"
                    name="numeroDocumento"
                    value={formData.propietario.numeroDocumento}
                    onChange={(e) => handleChange(e, 'propietario')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['propietario.numeroDocumento'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['propietario.numeroDocumento']}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Vehicle Information */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Información del Vehículo</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Esta información será almacenada en los metadatos del NFT.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Placa *
                  </label>
                  <input 
                    type="text"
                    name="placa"
                    value={formData.vehiculo.placa}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.placa'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.placa']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Matrícula Inicial (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaMatriculaInicial"
                    value={formData.vehiculo.fechaMatriculaInicial}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.fechaMatriculaInicial'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.fechaMatriculaInicial']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clase de Vehículo *
                  </label>
                  <select 
                    name="claseVehiculo"
                    value={formData.vehiculo.claseVehiculo}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione clase</option>
                    {clasesVehiculo.map(clase => (
                      <option key={clase} value={clase}>{clase}</option>
                    ))}
                  </select>
                  {errors['vehiculo.claseVehiculo'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.claseVehiculo']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marca *
                  </label>
                  <select 
                    name="marca"
                    value={formData.vehiculo.marca}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    disabled={!formData.vehiculo.claseVehiculo}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccione marca</option>
                    {formData.vehiculo.claseVehiculo && marcasPorTipo[formData.vehiculo.claseVehiculo as keyof typeof marcasPorTipo]?.map(marca => (
                      <option key={marca} value={marca}>{marca}</option>
                    ))}
                  </select>
                  {errors['vehiculo.marca'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.marca']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Línea (modelo específico) *
                  </label>
                  <input 
                    type="text"
                    name="linea"
                    value={formData.vehiculo.linea}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    placeholder="Ej. Corolla Altis"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.linea'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.linea']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modelo (Año) *
                  </label>
                  <input 
                    type="number"
                    name="modelo"
                    value={formData.vehiculo.modelo}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.modelo'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.modelo']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cilindraje (cc) *
                  </label>
                  <input 
                    type="number"
                    name="cilindraje"
                    value={formData.vehiculo.cilindraje}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.cilindraje'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.cilindraje']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color *
                  </label>
                  <input 
                    type="text"
                    name="color"
                    value={formData.vehiculo.color}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.color'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.color']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Servicio *
                  </label>
                  <select 
                    name="servicio"
                    value={formData.vehiculo.servicio}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione servicio</option>
                    {tiposServicio.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  {errors['vehiculo.servicio'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.servicio']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Carrocería *
                  </label>
                  <select 
                    name="tipoCarroceria"
                    value={formData.vehiculo.tipoCarroceria}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione tipo</option>
                    {tiposCarroceria.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  {errors['vehiculo.tipoCarroceria'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.tipoCarroceria']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Combustible *
                  </label>
                  <select 
                    name="combustible"
                    value={formData.vehiculo.combustible}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione combustible</option>
                    {tiposCombustible.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  {errors['vehiculo.combustible'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.combustible']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacidad (KG/PSJ) *
                  </label>
                  <input 
                    type="text"
                    name="capacidad"
                    value={formData.vehiculo.capacidad}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.capacidad'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.capacidad']}</p>
                  )}
                </div>
              </div>
              
              <h4 className="text-md font-semibold mt-6 mb-4 text-gray-800 dark:text-white">Información de Identificación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Motor *
                  </label>
                  <input 
                    type="text"
                    name="numeroMotor"
                    value={formData.vehiculo.numeroMotor}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.numeroMotor'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.numeroMotor']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    VIN *
                  </label>
                  <input 
                    type="text"
                    name="vin"
                    value={formData.vehiculo.vin}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.vin'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.vin']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Serie *
                  </label>
                  <input 
                    type="text"
                    name="numeroSerie"
                    value={formData.vehiculo.numeroSerie}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.numeroSerie'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.numeroSerie']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Chasis *
                  </label>
                  <input 
                    type="text"
                    name="numeroChasis"
                    value={formData.vehiculo.numeroChasis}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.numeroChasis'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.numeroChasis']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blindaje *
                  </label>
                  <select 
                    name="blindaje"
                    value={formData.vehiculo.blindaje}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione opción</option>
                    {opcionesSiNo.map(opcion => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                  {errors['vehiculo.blindaje'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.blindaje']}</p>
                  )}
                </div>
              </div>
              
              <h4 className="text-md font-semibold mt-6 mb-4 text-gray-800 dark:text-white">Información de Importación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Declaración de Importación *
                  </label>
                  <input 
                    type="text"
                    name="declaracionImportacion"
                    value={formData.vehiculo.declaracionImportacion}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.declaracionImportacion'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.declaracionImportacion']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Importación (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaImportacion"
                    value={formData.vehiculo.fechaImportacion}
                    onChange={(e) => handleChange(e, 'vehiculo')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['vehiculo.fechaImportacion'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['vehiculo.fechaImportacion']}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Vehicle Location */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Ubicación del Vehículo</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Esta información no será almacenada en los metadatos del NFT.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado *
                  </label>
                  <select 
                    name="estado"
                    value={formData.ubicacion.estado}
                    onChange={(e) => handleChange(e, 'ubicacion')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione estado</option>
                    {estadosVehiculo.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                  {errors['ubicacion.estado'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['ubicacion.estado']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kilometraje *
                  </label>
                  <input 
                    type="number"
                    name="kilometraje"
                    value={formData.ubicacion.kilometraje}
                    onChange={(e) => handleChange(e, 'ubicacion')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['ubicacion.kilometraje'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['ubicacion.kilometraje']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contacto Celular (Opcional)
                  </label>
                  <input 
                    type="text"
                    name="contactoCelular"
                    value={formData.ubicacion.contactoCelular}
                    onChange={(e) => handleChange(e, 'ubicacion')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['ubicacion.contactoCelular'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['ubicacion.contactoCelular']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Departamento *
                  </label>
                  <select 
                    name="departamento"
                    value={formData.ubicacion.departamento}
                    onChange={(e) => handleChange(e, 'ubicacion')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione departamento</option>
                    {departamentos.map(depto => (
                      <option key={depto} value={depto}>{depto}</option>
                    ))}
                  </select>
                  {errors['ubicacion.departamento'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['ubicacion.departamento']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad *
                  </label>
                  <input 
                    type="text"
                    name="ciudad"
                    value={formData.ubicacion.ciudad}
                    onChange={(e) => handleChange(e, 'ubicacion')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['ubicacion.ciudad'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['ubicacion.ciudad']}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: SOAT Information */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">SOAT</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Esta información no será almacenada en los metadatos del NFT.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entidad que expide SOAT *
                  </label>
                  <input 
                    type="text"
                    name="entidad"
                    value={formData.soat.entidad}
                    onChange={(e) => handleChange(e, 'soat')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['soat.entidad'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['soat.entidad']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de póliza *
                  </label>
                  <input 
                    type="text"
                    name="numeroPoliza"
                    value={formData.soat.numeroPoliza}
                    onChange={(e) => handleChange(e, 'soat')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['soat.numeroPoliza'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['soat.numeroPoliza']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de expedición (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaExpedicion"
                    value={formData.soat.fechaExpedicion}
                    onChange={(e) => handleChange(e, 'soat')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['soat.fechaExpedicion'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['soat.fechaExpedicion']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha inicio de vigencia (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaInicioVigencia"
                    value={formData.soat.fechaInicioVigencia}
                    onChange={(e) => handleChange(e, 'soat')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['soat.fechaInicioVigencia'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['soat.fechaInicioVigencia']}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  {formData.soat.fechaExpedicion && formData.soat.fechaInicioVigencia && isValidDate(formData.soat.fechaExpedicion) && isValidDate(formData.soat.fechaInicioVigencia) && (
                    <div className={`p-3 rounded ${formData.soat.vigente ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      <p className="font-medium">
                        {formData.soat.vigente ? 'SOAT Vigente' : 'SOAT No Vigente'}
                      </p>
                      <p className="text-sm">
                        {formData.soat.vigente 
                          ? 'El SOAT se encuentra dentro del período de vigencia.' 
                          : 'El SOAT ha expirado. Es necesario renovarlo para poder tokenizar el vehículo.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5: Technical Mechanical Information */}
          {currentStep === 5 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Revisión Técnico-Mecánica</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Esta información no será almacenada en los metadatos del NFT.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CDA que expide RTM *
                  </label>
                  <input 
                    type="text"
                    name="cda"
                    value={formData.tecnicoMecanica.cda}
                    onChange={(e) => handleChange(e, 'tecnicoMecanica')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['tecnicoMecanica.cda'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['tecnicoMecanica.cda']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de certificado *
                  </label>
                  <input 
                    type="text"
                    name="numeroCertificado"
                    value={formData.tecnicoMecanica.numeroCertificado}
                    onChange={(e) => handleChange(e, 'tecnicoMecanica')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['tecnicoMecanica.numeroCertificado'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['tecnicoMecanica.numeroCertificado']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de expedición (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaExpedicion"
                    value={formData.tecnicoMecanica.fechaExpedicion}
                    onChange={(e) => handleChange(e, 'tecnicoMecanica')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['tecnicoMecanica.fechaExpedicion'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['tecnicoMecanica.fechaExpedicion']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de vigencia (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaVigencia"
                    value={formData.tecnicoMecanica.fechaVigencia}
                    onChange={(e) => handleChange(e, 'tecnicoMecanica')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['tecnicoMecanica.fechaVigencia'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['tecnicoMecanica.fechaVigencia']}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  {formData.tecnicoMecanica.fechaExpedicion && formData.tecnicoMecanica.fechaVigencia && isValidDate(formData.tecnicoMecanica.fechaExpedicion) && isValidDate(formData.tecnicoMecanica.fechaVigencia) && (
                    <div className={`p-3 rounded ${formData.tecnicoMecanica.vigente ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      <p className="font-medium">
                        {formData.tecnicoMecanica.vigente ? 'Revisión Técnico-Mecánica Vigente' : 'Revisión Técnico-Mecánica No Vigente'}
                      </p>
                      <p className="text-sm">
                        {formData.tecnicoMecanica.vigente 
                          ? 'La Revisión Técnico-Mecánica se encuentra dentro del período de vigencia.' 
                          : 'La Revisión Técnico-Mecánica ha expirado. Es necesario renovarla para poder tokenizar el vehículo.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 6: Expert Assessment */}
          {currentStep === 6 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Peritaje</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Esta información no será almacenada en los metadatos del NFT.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ¿Tiene peritaje? *
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="tienePenitaje"
                        checked={formData.peritaje.tienePenitaje === true}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          peritaje: {
                            ...prev.peritaje,
                            tienePenitaje: true
                          }
                        }))}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sí</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="tienePenitaje"
                        checked={formData.peritaje.tienePenitaje === false}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          peritaje: {
                            ...prev.peritaje,
                            tienePenitaje: false
                          }
                        }))}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
                    </label>
                  </div>
                  {errors['peritaje.tienePenitaje'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['peritaje.tienePenitaje']}</p>
                  )}
                </div>
                
                {formData.peritaje.tienePenitaje && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Entidad Emisora
                      </label>
                      <input 
                        type="text"
                        name="entidadEmisora"
                        value={formData.peritaje.entidadEmisora}
                        onChange={(e) => handleChange(e, 'peritaje')}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors['peritaje.entidadEmisora'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['peritaje.entidadEmisora']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Adjuntar Archivo
                      </label>
                      <input 
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'peritaje', 'archivo')}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {errors['peritaje.archivo'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['peritaje.archivo']}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Step 7: Insurance Information */}
          {currentStep === 7 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Seguro</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                Esta información no será almacenada en los metadatos del NFT.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entidad Aseguradora *
                  </label>
                  <input 
                    type="text"
                    name="entidadAseguradora"
                    value={formData.seguro.entidadAseguradora}
                    onChange={(e) => handleChange(e, 'seguro')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['seguro.entidadAseguradora'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['seguro.entidadAseguradora']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de póliza *
                  </label>
                  <input 
                    type="text"
                    name="numeroPoliza"
                    value={formData.seguro.numeroPoliza}
                    onChange={(e) => handleChange(e, 'seguro')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['seguro.numeroPoliza'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['seguro.numeroPoliza']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de expedición (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaExpedicion"
                    value={formData.seguro.fechaExpedicion}
                    onChange={(e) => handleChange(e, 'seguro')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['seguro.fechaExpedicion'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['seguro.fechaExpedicion']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha inicio de vigencia (dd/mm/aaaa) *
                  </label>
                  <input 
                    type="text"
                    name="fechaInicioVigencia"
                    value={formData.seguro.fechaInicioVigencia}
                    onChange={(e) => handleChange(e, 'seguro')}
                    placeholder="dd/mm/aaaa"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors['seguro.fechaInicioVigencia'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['seguro.fechaInicioVigencia']}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  {formData.seguro.fechaExpedicion && formData.seguro.fechaInicioVigencia && isValidDate(formData.seguro.fechaExpedicion) && isValidDate(formData.seguro.fechaInicioVigencia) && (
                    <div className={`p-3 rounded ${formData.seguro.vigente ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      <p className="font-medium">
                        {formData.seguro.vigente ? 'Seguro Vigente' : 'Seguro No Vigente'}
                      </p>
                      <p className="text-sm">
                        {formData.seguro.vigente 
                          ? 'El seguro se encuentra dentro del período de vigencia.' 
                          : 'El seguro ha expirado. Es necesario renovarlo para poder tokenizar el vehículo.'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 mt-4">
                  <div className="flex items-center">
                    <input
                      id="aceptaTerminos"
                      name="aceptaTerminos"
                      type="checkbox"
                      checked={formData.aceptaTerminos}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        aceptaTerminos: e.target.checked
                      }))}
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
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                Anterior
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitStatus === 'processing'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
              >
                {submitStatus === 'processing' ? 'Procesando...' : 'Tokenizar Vehículo'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } 