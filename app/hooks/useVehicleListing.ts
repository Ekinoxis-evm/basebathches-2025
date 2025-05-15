import { useCallback } from 'react';
import { useContractRead, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { VEHICLE_LISTING_REGISTRY_ABI, CONTRACT_ADDRESSES } from '../contracts/config';

// Listing status enum
export enum ListingStatus {
  Active = 0,
  InEscrow = 1,
  Sold = 2,
  Cancelled = 3
}

// Vehicle location interface
export interface VehicleLocation {
  estado: string;
  contactoCelular: string;
  departamento: string;
  ciudad: string;
  direccion: string;
}

// Document status interface
export interface DocumentStatus {
  soatEntidad: string;
  soatNumeroPoliza: string;
  soatFechaExpedicion: bigint;
  soatFechaVigencia: bigint;
  soatVigente: boolean;
  rtmEntidad: string;
  rtmNumeroCertificado: string;
  rtmFechaExpedicion: bigint;
  rtmFechaVigencia: bigint;
  rtmVigente: boolean;
  tienePertitaje: boolean;
  peritajeEntidad: string;
  peritajeDocumentoURI: string;
  seguroEntidad: string;
  seguroNumeroPoliza: string;
  seguroFechaExpedicion: bigint;
  seguroFechaVigencia: bigint;
  seguroVigente: boolean;
}

// Vehicle listing interface
export interface VehicleListing {
  owner: string;
  nftContract: string;
  tokenId: bigint;
  price: bigint;
  escrowId: bigint;
  status: ListingStatus;
  createdAt: bigint;
  updatedAt: bigint;
  metadataURI: string;
}

// Full listing details
export interface FullListingDetails {
  listing: VehicleListing;
  location: VehicleLocation;
  documents: DocumentStatus;
}

// Custom hook for interacting with the VehicleListingRegistry contract
export function useVehicleListing() {
  // Get current listing ID
  const { data: currentListingId } = useContractRead({
    address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
    abi: VEHICLE_LISTING_REGISTRY_ABI,
    functionName: 'getCurrentListingId',
  });

  // Create listing
  const { write: createListing } = useContractWrite({
    address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
    abi: VEHICLE_LISTING_REGISTRY_ABI,
    functionName: 'createListing',
  });

  // Update location
  const { write: updateLocation } = useContractWrite({
    address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
    abi: VEHICLE_LISTING_REGISTRY_ABI,
    functionName: 'updateLocation',
  });

  // Update documents
  const { write: updateDocuments } = useContractWrite({
    address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
    abi: VEHICLE_LISTING_REGISTRY_ABI,
    functionName: 'updateDocuments',
  });

  // Create escrow with default settings
  const { write: createDefaultEscrow } = useContractWrite({
    address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
    abi: VEHICLE_LISTING_REGISTRY_ABI,
    functionName: 'createEscrow',
  });

  // Create escrow with custom settings (with arbiter and signature requirements)
  const { write: createCustomEscrow } = useContractWrite({
    address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
    abi: VEHICLE_LISTING_REGISTRY_ABI,
    functionName: 'createEscrowWithSettings',
  });

  // Get full listing details
  const getFullListingDetails = useCallback(async (listingId: bigint): Promise<FullListingDetails | null> => {
    try {
      const result = await fetch(`/api/listings/${listingId}`);
      if (!result.ok) throw new Error('Failed to fetch listing details');
      return await result.json();
    } catch (err) {
      console.error('Error fetching listing details:', err);
      return null;
    }
  }, []);

  // Helper function to create a standard vehicle listing
  const createVehicleListing = useCallback(
    (nftContract: string, tokenId: bigint, price: string, metadataURI: string) => {
      if (createListing) {
        const priceInWei = parseEther(price);
        createListing({
          args: [nftContract, tokenId, priceInWei, metadataURI],
        });
      }
    },
    [createListing]
  );

  // Helper function to update vehicle location
  const updateVehicleLocation = useCallback(
    (
      listingId: bigint,
      estado: string,
      contactoCelular: string,
      departamento: string,
      ciudad: string,
      direccion: string
    ) => {
      if (updateLocation) {
        updateLocation({
          args: [listingId, estado, contactoCelular, departamento, ciudad, direccion],
        });
      }
    },
    [updateLocation]
  );

  // Helper function to update vehicle documents
  const updateVehicleDocuments = useCallback(
    (
      listingId: bigint,
      soatEntidad: string,
      soatNumeroPoliza: string,
      soatFechaExpedicion: bigint,
      soatFechaVigencia: bigint,
      rtmEntidad: string,
      rtmNumeroCertificado: string,
      rtmFechaExpedicion: bigint,
      rtmFechaVigencia: bigint,
      tienePertitaje: boolean,
      peritajeEntidad: string,
      peritajeDocumentoURI: string,
      seguroEntidad: string,
      seguroNumeroPoliza: string,
      seguroFechaExpedicion: bigint,
      seguroFechaVigencia: bigint
    ) => {
      if (updateDocuments) {
        updateDocuments({
          args: [
            listingId,
            soatEntidad,
            soatNumeroPoliza,
            soatFechaExpedicion,
            soatFechaVigencia,
            rtmEntidad,
            rtmNumeroCertificado,
            rtmFechaExpedicion,
            rtmFechaVigencia,
            tienePertitaje,
            peritajeEntidad,
            peritajeDocumentoURI,
            seguroEntidad,
            seguroNumeroPoliza,
            seguroFechaExpedicion,
            seguroFechaVigencia,
          ],
        });
      }
    },
    [updateDocuments]
  );

  // Helper function to create escrow with default settings (2-of-2 signatures)
  const createStandardEscrow = useCallback(
    (listingId: bigint) => {
      if (createDefaultEscrow) {
        createDefaultEscrow({
          args: [listingId],
        });
      }
    },
    [createDefaultEscrow]
  );

  // Helper function to create escrow with arbiter and custom settings
  const createEscrowWithArbiter = useCallback(
    (
      listingId: bigint,
      arbiter: string,
      requireBuyer: boolean = true,
      requireSeller: boolean = true,
      requireArbiter: boolean = true,
      threshold: number = 2,
      expirationDays: number = 0
    ) => {
      if (createCustomEscrow) {
        const expirationTime = expirationDays > 0
          ? BigInt(Math.floor(Date.now() / 1000) + expirationDays * 86400)
          : 0n;
          
        createCustomEscrow({
          args: [
            listingId,
            arbiter,
            requireBuyer,
            requireSeller,
            requireArbiter,
            threshold,
            expirationTime
          ],
        });
      }
    },
    [createCustomEscrow]
  );

  return {
    currentListingId,
    getFullListingDetails,
    createVehicleListing,
    updateVehicleLocation,
    updateVehicleDocuments,
    createStandardEscrow,
    createEscrowWithArbiter,
  };
} 