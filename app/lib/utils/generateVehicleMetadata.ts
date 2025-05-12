import { uploadMetadataToIPFS } from '../ipfs/pinata';

interface VehicleData {
  placa: string;
  fechaMatriculaInicial: string;
  marca: string;
  linea: string;
  modelo: string;
  cilindraje: string;
  color: string;
  servicio: string;
  claseVehiculo: string;
  tipoCarroceria: string;
  combustible: string;
  capacidad: string;
  numeroMotor: string;
  vin: string;
  numeroSerie: string;
  numeroChasis: string;
  blindaje: string;
  declaracionImportacion: string;
  fechaImportacion: string;
}

export const generateAndUploadMetadata = async (
  vehicle: VehicleData,
  imageUrl: string
): Promise<string> => {
  const metadata = {
    name: `Vehículo ${vehicle.placa}`,
    description: `Token NFT que representa el vehículo con placa ${vehicle.placa}`,
    image: imageUrl,
    attributes: [
      { trait_type: 'Marca', value: vehicle.marca },
      { trait_type: 'Línea', value: vehicle.linea },
      { trait_type: 'Modelo', value: vehicle.modelo },
      { trait_type: 'Cilindraje', value: vehicle.cilindraje },
      { trait_type: 'Color', value: vehicle.color },
      { trait_type: 'Servicio', value: vehicle.servicio },
      { trait_type: 'Clase Vehículo', value: vehicle.claseVehiculo },
      { trait_type: 'Tipo Carrocería', value: vehicle.tipoCarroceria },
      { trait_type: 'Combustible', value: vehicle.combustible },
      { trait_type: 'Capacidad', value: vehicle.capacidad },
      { trait_type: 'Número Motor', value: vehicle.numeroMotor },
      { trait_type: 'VIN', value: vehicle.vin },
      { trait_type: 'Número Serie', value: vehicle.numeroSerie },
      { trait_type: 'Número Chasis', value: vehicle.numeroChasis },
      { trait_type: 'Blindaje', value: vehicle.blindaje },
      { trait_type: 'Declaración Importación', value: vehicle.declaracionImportacion },
      { trait_type: 'Fecha Importación', value: vehicle.fechaImportacion },
      { trait_type: 'Fecha Matrícula Inicial', value: vehicle.fechaMatriculaInicial }
    ]
  };

  const metadataUrl = await uploadMetadataToIPFS(metadata);
  return metadataUrl;
};
