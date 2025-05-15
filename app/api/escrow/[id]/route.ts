import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, SIGNATURE_ESCROW_ABI } from '@/app/contracts/config';

// Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Interface for the escrow details returned from the contract
interface EscrowDetailsResponse {
  seller: string;
  nftContract: string;
  tokenId: bigint;
  paymentToken: string;
  price: bigint;
  buyer: string;
  arbiter: string;
  state: number;
  requireBuyer: boolean;
  requireSeller: boolean;
  requireArbiter: boolean;
  threshold: number;
  expirationTime: bigint;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const escrowId = params.id;

    if (!escrowId || !/^\d+$/.test(escrowId)) {
      return NextResponse.json(
        { error: 'Invalid escrow ID' },
        { status: 400 }
      );
    }

    // Read the escrow details from the contract
    const escrowData = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
      abi: SIGNATURE_ESCROW_ABI,
      functionName: 'getEscrowDetails',
      args: [BigInt(escrowId)],
    }) as [string, string, bigint, string, bigint, string, string, number, boolean, boolean, boolean, number, bigint];

    // Convert the array response to an object for easier consumption
    const escrowDetails: EscrowDetailsResponse = {
      seller: escrowData[0],
      nftContract: escrowData[1],
      tokenId: escrowData[2],
      paymentToken: escrowData[3],
      price: escrowData[4],
      buyer: escrowData[5],
      arbiter: escrowData[6],
      state: escrowData[7],
      requireBuyer: escrowData[8],
      requireSeller: escrowData[9],
      requireArbiter: escrowData[10],
      threshold: escrowData[11],
      expirationTime: escrowData[12],
    };

    // Get transaction approval count (this would need its own contract method in a real implementation)
    // Here we're mocking it for demonstration purposes
    const approvalData = {
      currentApprovals: 0, // In a real implementation, fetch this from the contract
      requiredApprovals: escrowDetails.threshold,
    };

    return NextResponse.json({
      ...escrowDetails,
      ...approvalData,
    });
  } catch (error) {
    console.error('Error fetching escrow details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escrow details' },
      { status: 500 }
    );
  }
} 