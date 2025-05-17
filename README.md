# CarP2P Smart Contract System

This directory contains the smart contracts for the CarP2P platform, a blockchain-based vehicle trading platform that enables secure tokenization, trading, and financing of vehicles using NFTs.

## Contract Overview

The CarP2P platform uses four main smart contracts that work together to provide a comprehensive vehicle trading solution:

1. **VehicleNFT**: Tokenizes vehicles as NFTs with associated metadata
2. **EscrowNFT**: Provides basic escrow functionality for NFT sales
3. **VehicleListingRegistry**: Stores detailed vehicle listing information with documentation
4. **SignatureEscrow**: Advanced multi-signature escrow with cryptographic signatures

## VehicleNFT

The VehicleNFT contract is responsible for tokenizing vehicles as NFTs. Each NFT represents a vehicle and contains metadata linking to the vehicle's details.

Key features:
- Mint new vehicle NFTs with associated metadata
- Support for authorized minters to create tokens
- Public minting for vehicle owners
- ERC-721 compliant tokens with metadata URIs

## EscrowNFT

The EscrowNFT contract enables secure transactions between buyers and sellers by acting as a trusted intermediary.

Key features:
- Hold NFTs and payments securely during transactions
- Two-step approval process (seller and buyer must agree)
- Automatic settlement when both parties approve
- Automatic refunds when either party cancels
- Admin cancellation for emergencies

Usage flow:
1. Seller creates an escrow with their NFT
2. Buyer is assigned and deposits payment
3. Both parties sign their approval
4. Upon both signatures, the NFT goes to the buyer and payment to the seller

## VehicleListingRegistry

The VehicleListingRegistry contract stores comprehensive information about vehicle listings, including all necessary documentation and location data required for vehicle sales.

Key features:
- Detailed vehicle location data (estado, departamento, ciudad)
- Document validation storage:
  - SOAT (Mandatory insurance)
  - RTM (Technical-mechanical inspection)
  - Peritaje (Vehicle assessment)
  - Additional Insurance
- Integration with EscrowNFT for secure trading
- Listing status tracking (Active, InEscrow, Sold, Cancelled)

Usage flow:
1. Seller creates a listing with basic vehicle info
2. Seller adds location and documentation details
3. Seller can create an escrow to facilitate a secure sale
4. The system tracks the status throughout the trading process

## SignatureEscrow

The SignatureEscrow contract provides an enhanced escrow system that uses EIP-712 signatures for multi-party verification, similar to multisignature wallets like Safe.

Key features:
- EIP-712 compliant cryptographic signatures
- Support for off-chain signatures (gasless for signers)
- Configurable signature requirements:
  - Optional third-party arbiter for dispute resolution
  - Flexible threshold of required signatures (1-3)
  - Customizable participant requirements
- Optional escrow expiration
- Both on-chain and off-chain transaction approvals

Usage flow:
1. Seller creates an escrow with specific signature requirements
2. Buyer is assigned and deposits payment
3. Required parties provide their signatures (on-chain or off-chain)
4. Once the threshold of signatures is met, the transaction completes
5. If insufficient signatures are collected before expiration, the escrow can be cancelled

## Integration Between Contracts

The contracts integrate as follows:

- **VehicleNFT** creates the tokenized asset that represents the vehicle
- **VehicleListingRegistry** stores detailed information about the vehicle listing
- **EscrowNFT** provides basic escrow functionality for simple trades
- **SignatureEscrow** provides enhanced escrow with cryptographic signatures for more complex scenarios

The frontend interfaces with these contracts via React hooks:
- `useVehicleNFT`: For minting and managing vehicle NFTs
- `useVehicleListing`: For creating and managing vehicle listings
- `useSignatureEscrow`: For advanced multi-signature escrow operations
- `useSecureVehicleTrading`: A composite hook that ties the entire system together

## Deployment

The contracts are deployed on the Base Sepolia testnet with the following addresses:
- VehicleNFT_V2: `0x20AdEbac56B2b2d7FE7967fCec780363A070be3A`
- EscrowNFT: `0x7F5A7955fCfD4419e11E465cfa5236EFd89e8a4c`
- VehicleListingRegistry: To be deployed
- SignatureEscrow: To be deployed

## Security Considerations

The contracts implement several security measures:
- Reentrancy protection via OpenZeppelin's ReentrancyGuard
- Access control for sensitive operations
- EIP-712 cryptographic signatures for secure off-chain approvals
- Explicit state validation to prevent unexpected transitions

## Extending the System

To extend this system for additional functionality:
1. Modify or inherit from existing contracts to add new features
2. Update the config.ts file with new contract addresses
3. Create new React hooks to interface with the added functionality
4. Integrate into the frontend UI components 



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`]().

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about OnchainKit, see our [documentation](https://onchainkit.xyz/getting-started).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).
