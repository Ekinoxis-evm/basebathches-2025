import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, VEHICLE_LISTING_REGISTRY_ABI } from '@/app/contracts/config';

// Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Interface for the listing details returned from the contract
interface FullListingDetailsResponse {
  listing: {
    owner: string;
    nftContract: string;
    tokenId: bigint;
    price: bigint;
    escrowId: bigint;
    status: number;
    createdAt: bigint;
    updatedAt: bigint;
    metadataURI: string;
  };
  location: {
    estado: string;
    contactoCelular: string;
    departamento: string;
    ciudad: string;
    direccion: string;
  };
  documents: {
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
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

    if (!listingId || !/^\d+$/.test(listingId)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Read the listing details from the contract
    const listingData = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.VehicleListingRegistry as `0x${string}`,
      abi: VEHICLE_LISTING_REGISTRY_ABI,
      functionName: 'getFullListingDetails',
      args: [BigInt(listingId)],
    }) as [any, any, any]; // Type assertion as tuple of tuple structures

    const listingDetails: FullListingDetailsResponse = {
      listing: {
        owner: listingData[0].owner,
        nftContract: listingData[0].nftContract,
        tokenId: listingData[0].tokenId,
        price: listingData[0].price,
        escrowId: listingData[0].escrowId,
        status: listingData[0].status,
        createdAt: listingData[0].createdAt,
        updatedAt: listingData[0].updatedAt,
        metadataURI: listingData[0].metadataURI,
      },
      location: {
        estado: listingData[1].estado,
        contactoCelular: listingData[1].contactoCelular,
        departamento: listingData[1].departamento,
        ciudad: listingData[1].ciudad,
        direccion: listingData[1].direccion,
      },
      documents: {
        soatEntidad: listingData[2].soatEntidad,
        soatNumeroPoliza: listingData[2].soatNumeroPoliza,
        soatFechaExpedicion: listingData[2].soatFechaExpedicion,
        soatFechaVigencia: listingData[2].soatFechaVigencia,
        soatVigente: listingData[2].soatVigente,
        rtmEntidad: listingData[2].rtmEntidad,
        rtmNumeroCertificado: listingData[2].rtmNumeroCertificado,
        rtmFechaExpedicion: listingData[2].rtmFechaExpedicion,
        rtmFechaVigencia: listingData[2].rtmFechaVigencia,
        rtmVigente: listingData[2].rtmVigente,
        tienePertitaje: listingData[2].tienePertitaje,
        peritajeEntidad: listingData[2].peritajeEntidad,
        peritajeDocumentoURI: listingData[2].peritajeDocumentoURI,
        seguroEntidad: listingData[2].seguroEntidad,
        seguroNumeroPoliza: listingData[2].seguroNumeroPoliza,
        seguroFechaExpedicion: listingData[2].seguroFechaExpedicion,
        seguroFechaVigencia: listingData[2].seguroFechaVigencia,
        seguroVigente: listingData[2].seguroVigente,
      },
    };

    return NextResponse.json(listingDetails);
  } catch (error) {
    console.error('Error fetching listing details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing details' },
      { status: 500 }
    );
  }
} 