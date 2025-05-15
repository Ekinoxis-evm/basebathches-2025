# CarP2P Secure Vehicle Trading System

This document explains how to use the new SignatureEscrow-based secure vehicle trading system for CarP2P - a blockchain-based car NFT platform.

## Overview

The secure vehicle trading system replaces the previous EscrowNFT contract with a more sophisticated SignatureEscrow system that supports:

- Off-chain signature support (gasless approvals)
- Configurable signature requirements (buyer, seller, optional arbiter)
- Flexible threshold-based approvals (e.g., 2-of-3 required signatures)
- Expiration timeouts for escrows
- Both on-chain and off-chain transaction approvals

## Key Components

1. **SignatureEscrow Contract**: Implements EIP-712 compliant signatures for escrow operations
2. **VehicleListingRegistry Contract**: Stores comprehensive vehicle data and integrates with SignatureEscrow
3. **Frontend React Hooks**: Interface with the contracts to provide a seamless UX

## Usage Instructions

### For Sellers

#### Creating a Vehicle Listing

```typescript
// Import the hook
import { useSecureVehicleTrading } from '@/hooks/useSecureVehicleTrading';

// Use in your component
const { listVehicleForSale } = useSecureVehicleTrading();

// Create a listing with standard escrow (2-of-2 signatures required)
await listVehicleForSale(
  nftContractAddress,
  tokenId,
  price,
  metadataURI
);

// Create a listing with arbiter (2-of-3 signatures required)
await listVehicleForSale(
  nftContractAddress,
  tokenId,
  price,
  metadataURI,
  true, // use arbiter
  arbiterAddress,
  7 // 7-day expiration
);
```

#### Approving Transaction Completion

```typescript
import { useSecureVehicleTrading } from '@/hooks/useSecureVehicleTrading';
import { TransactionType } from '@/hooks/useSignatureEscrow';

// Use in your component
const { approveTransaction, signTransaction } = useSecureVehicleTrading();

// Option 1: On-chain approval (costs gas)
await approveTransaction(escrowId, TransactionType.CompleteEscrow);

// Option 2: Off-chain signature (gasless)
await signTransaction(escrowId, TransactionType.CompleteEscrow);
```

### For Buyers

#### Participating in a Vehicle Purchase

```typescript
import { useSecureVehicleTrading } from '@/hooks/useSecureVehicleTrading';

// Use in your component
const { participateAsBuyer, makePayment } = useSecureVehicleTrading();

// Step 1: Register as a buyer
await participateAsBuyer(escrowId);

// Step 2: Make payment
await makePayment(escrowId);

// Step 3: Approve transaction (same as seller, see above)
```

### For Arbiters

```typescript
import { useSecureVehicleTrading } from '@/hooks/useSecureVehicleTrading';
import { TransactionType } from '@/hooks/useSignatureEscrow';

// Use in your component
const { approveTransaction, signTransaction } = useSecureVehicleTrading();

// Option 1: Approve completion
await approveTransaction(escrowId, TransactionType.CompleteEscrow);

// Option 2: Approve cancellation
await approveTransaction(escrowId, TransactionType.CancelEscrow);
```

## UI Component

The `SignatureApprovalForm` component provides a complete UI for the signature process:

```jsx
import { SignatureApprovalForm } from '@/components/SignatureApprovalForm';

// In your component render method
return (
  <SignatureApprovalForm 
    escrowId={escrowId}
    listingId={listingId}
    onComplete={() => console.log('Transaction completed')}
  />
);
```

This component displays:
- Current signature status (x of y required signatures)
- Progress bar for signature collection
- List of required signers
- Options for on-chain (gas fee) or off-chain (gasless) signatures
- Transaction status updates

## Benefits of the New System

1. **Enhanced Security**: Multiple signatures provide better security for high-value transactions
2. **Cost Efficiency**: Off-chain signatures reduce gas costs
3. **Flexibility**: Configurable threshold allows for different security levels based on transaction value
4. **Expiration**: Auto-cancellation prevents funds from being locked indefinitely
5. **Dispute Resolution**: Optional arbiter provides mediation for complex transactions

## Technical Implementation

- Uses EIP-712 typed structured data for secure signatures
- Implements threshold signature verification
- Supports both direct on-chain approvals and off-chain signatures
- Tracks nonces to prevent signature replay attacks
- Provides expiration mechanism for time-limited escrows

## Configuration

The contract addresses are specified in `app/contracts/config.ts`. After deployment, update:

```typescript
export const CONTRACT_ADDRESSES = {
  VehicleNFT_V2: "0x20AdEbac56B2b2d7FE7967fCec780363A070be3A",
  EscrowNFT: "0x7F5A7955fCfD4419e11E465cfa5236EFd89e8a4c", // Legacy contract
  SignatureEscrow: "0x...", // New contract address
  VehicleListingRegistry: "0x...", // New contract address
};
``` 