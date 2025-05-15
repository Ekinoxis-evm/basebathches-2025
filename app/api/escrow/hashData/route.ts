import { NextRequest, NextResponse } from 'next/server';
import { CONTRACT_ADDRESSES } from '@/app/contracts/config';

// EIP-712 TypedData structure
const DOMAIN = {
  name: 'SignatureEscrow',
  version: '1.0.0',
  chainId: 84532, // Base Sepolia chain ID
  verifyingContract: CONTRACT_ADDRESSES.SignatureEscrow,
};

const TYPES = {
  EscrowTransaction: [
    { name: 'escrowId', type: 'uint256' },
    { name: 'transactionType', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { escrowId, txType, signer } = data;

    if (!escrowId || txType === undefined || !signer) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch the user's current nonce
    const nonceResponse = await fetch(`/api/escrow/nonce/${signer}`);
    if (!nonceResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user nonce' },
        { status: 500 }
      );
    }
    
    const { nonce } = await nonceResponse.json();

    // Construct the typed data
    const value = {
      escrowId,
      transactionType: txType,
      nonce,
    };

    return NextResponse.json({
      domain: DOMAIN,
      types: TYPES,
      value,
    });
  } catch (error) {
    console.error('Error generating hash data:', error);
    return NextResponse.json(
      { error: 'Failed to generate hash data' },
      { status: 500 }
    );
  }
} 