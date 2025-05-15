import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, SIGNATURE_ESCROW_ABI } from '@/app/contracts/config';

// Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Read the nonce from the contract
    const nonce = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.SignatureEscrow as `0x${string}`,
      abi: SIGNATURE_ESCROW_ABI,
      functionName: 'getNonce',
      args: [address as `0x${string}`],
    });

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Error fetching nonce:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nonce' },
      { status: 500 }
    );
  }
} 