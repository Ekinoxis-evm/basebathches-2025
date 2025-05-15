// Contract addresses
export const CONTRACT_ADDRESSES = {
  VehicleNFT_V2: "0x20AdEbac56B2b2d7FE7967fCec780363A070be3A",
  EscrowNFT: "0x7F5A7955fCfD4419e11E465cfa5236EFd89e8a4c",
  SignatureEscrow: "0x0000000000000000000000000000000000000000", // TODO: Deploy and replace with actual address
  VehicleListingRegistry: "0x0000000000000000000000000000000000000000", // TODO: Deploy and replace with actual address
};

// Contract owner address
export const CONTRACT_OWNER = "0x3f9b734394FC1E96afe9523c69d30D227dF4ffca";

// VehicleNFT V2 ABI
export const VEHICLE_NFT_V2_ABI = [
  {
    inputs: [
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'publicMintVehicleNFT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mintVehicleNFT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'minter', type: 'address' }
    ],
    name: 'authorizeMinter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'minter', type: 'address' }
    ],
    name: 'isMinterAuthorized',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'tokenURI', type: 'string' }
    ],
    name: 'VehicleNFTMinted',
    type: 'event',
  },
];

// Basic VehicleNFT ABI (for backward compatibility)
export const VEHICLE_NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mintVehicleNFT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'tokenURI', type: 'string' }
    ],
    name: 'VehicleNFTMinted',
    type: 'event',
  },
];

// Minimal ABIs for interacting with contracts through hooks
export const SIGNATURE_ESCROW_ABI = [
  // Create escrow
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'arbiter', type: 'address' },
      { name: 'requireBuyer', type: 'bool' },
      { name: 'requireSeller', type: 'bool' },
      { name: 'requireArbiter', type: 'bool' },
      { name: 'threshold', type: 'uint8' },
      { name: 'expirationTime', type: 'uint256' }
    ],
    name: 'createEscrow',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Assign buyer
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' }
    ],
    name: 'assignAsBuyer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Assign arbiter
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'arbiter', type: 'address' }
    ],
    name: 'assignArbiter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Deposit payment
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' }
    ],
    name: 'depositPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Approve transaction
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'txType', type: 'uint8' }
    ],
    name: 'approveTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Approve with signature
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'txType', type: 'uint8' },
      { name: 'signer', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'approveTransactionWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Get escrow details
  {
    inputs: [
      { name: 'escrowId', type: 'uint256' }
    ],
    name: 'getEscrowDetails',
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'buyer', type: 'address' },
      { name: 'arbiter', type: 'address' },
      { name: 'state', type: 'uint8' },
      { name: 'requireBuyer', type: 'bool' },
      { name: 'requireSeller', type: 'bool' },
      { name: 'requireArbiter', type: 'bool' },
      { name: 'threshold', type: 'uint8' },
      { name: 'expirationTime', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get nonce
  {
    inputs: [
      { name: 'user', type: 'address' }
    ],
    name: 'getNonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Get current escrow ID
  {
    inputs: [],
    name: 'getCurrentEscrowId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export const VEHICLE_LISTING_REGISTRY_ABI = [
  // Create listing
  {
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'metadataURI', type: 'string' }
    ],
    name: 'createListing',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Update location
  {
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'estado', type: 'string' },
      { name: 'contactoCelular', type: 'string' },
      { name: 'departamento', type: 'string' },
      { name: 'ciudad', type: 'string' },
      { name: 'direccion', type: 'string' }
    ],
    name: 'updateLocation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Update documents
  {
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'soatEntidad', type: 'string' },
      { name: 'soatNumeroPoliza', type: 'string' },
      { name: 'soatFechaExpedicion', type: 'uint256' },
      { name: 'soatFechaVigencia', type: 'uint256' },
      { name: 'rtmEntidad', type: 'string' },
      { name: 'rtmNumeroCertificado', type: 'string' },
      { name: 'rtmFechaExpedicion', type: 'uint256' },
      { name: 'rtmFechaVigencia', type: 'uint256' },
      { name: 'tienePertitaje', type: 'bool' },
      { name: 'peritajeEntidad', type: 'string' },
      { name: 'peritajeDocumentoURI', type: 'string' },
      { name: 'seguroEntidad', type: 'string' },
      { name: 'seguroNumeroPoliza', type: 'string' },
      { name: 'seguroFechaExpedicion', type: 'uint256' },
      { name: 'seguroFechaVigencia', type: 'uint256' }
    ],
    name: 'updateDocuments',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Create escrow with default settings
  {
    inputs: [
      { name: 'listingId', type: 'uint256' }
    ],
    name: 'createEscrow',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Create escrow with custom settings
  {
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'arbiter', type: 'address' },
      { name: 'requireBuyer', type: 'bool' },
      { name: 'requireSeller', type: 'bool' },
      { name: 'requireArbiter', type: 'bool' },
      { name: 'threshold', type: 'uint8' },
      { name: 'expirationTime', type: 'uint256' }
    ],
    name: 'createEscrowWithSettings',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Get full listing details
  {
    inputs: [
      { name: 'listingId', type: 'uint256' }
    ],
    name: 'getFullListingDetails',
    outputs: [
      { name: 'listing', type: 'tuple', components: [
        { name: 'owner', type: 'address' },
        { name: 'nftContract', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'escrowId', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'updatedAt', type: 'uint256' },
        { name: 'metadataURI', type: 'string' }
      ]},
      { name: 'location', type: 'tuple', components: [
        { name: 'estado', type: 'string' },
        { name: 'contactoCelular', type: 'string' },
        { name: 'departamento', type: 'string' },
        { name: 'ciudad', type: 'string' },
        { name: 'direccion', type: 'string' }
      ]},
      { name: 'documents', type: 'tuple', components: [
        { name: 'soatEntidad', type: 'string' },
        { name: 'soatNumeroPoliza', type: 'string' },
        { name: 'soatFechaExpedicion', type: 'uint256' },
        { name: 'soatFechaVigencia', type: 'uint256' },
        { name: 'soatVigente', type: 'bool' },
        { name: 'rtmEntidad', type: 'string' },
        { name: 'rtmNumeroCertificado', type: 'string' },
        { name: 'rtmFechaExpedicion', type: 'uint256' },
        { name: 'rtmFechaVigencia', type: 'uint256' },
        { name: 'rtmVigente', type: 'bool' },
        { name: 'tienePertitaje', type: 'bool' },
        { name: 'peritajeEntidad', type: 'string' },
        { name: 'peritajeDocumentoURI', type: 'string' },
        { name: 'seguroEntidad', type: 'string' },
        { name: 'seguroNumeroPoliza', type: 'string' },
        { name: 'seguroFechaExpedicion', type: 'uint256' },
        { name: 'seguroFechaVigencia', type: 'uint256' },
        { name: 'seguroVigente', type: 'bool' }
      ]}
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get current listing ID
  {
    inputs: [],
    name: 'getCurrentListingId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
]; 