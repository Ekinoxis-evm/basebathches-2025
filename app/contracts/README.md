# Contract Configuration

This directory contains centralized contract configuration used by the application.

## File Structure

- `config.ts`: Central configuration file containing contract addresses, ABIs, and other contract-related constants

## Usage

To use the contract configuration in your components or hooks:

```typescript
import { CONTRACT_ADDRESSES, CONTRACT_OWNER, VEHICLE_NFT_V2_ABI } from '../contracts/config';

// Access contract addresses
const vehicleNftAddress = CONTRACT_ADDRESSES.VehicleNFT_V2;

// Use ABIs for contract interactions
const contractConfig = {
  address: CONTRACT_ADDRESSES.VehicleNFT_V2 as `0x${string}`,
  abi: VEHICLE_NFT_V2_ABI,
};
```

## Why This Approach?

We've centralized all contract configuration to:

1. Ensure consistency across the application
2. Make it easier to update contract addresses or ABIs when deploying to different networks
3. Avoid TypeScript errors related to importing JSON files
4. Provide proper typing for contract interactions

Previously, the project used a mix of hardcoded values and JSON imports, which caused TypeScript errors and inconsistency in the codebase. 