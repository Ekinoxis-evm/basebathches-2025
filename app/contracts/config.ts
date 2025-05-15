// Contract addresses
export const CONTRACT_ADDRESSES = {
  VehicleNFT_V2: "0x20AdEbac56B2b2d7FE7967fCec780363A070be3A",
  EscrowNFT: "0x7F5A7955fCfD4419e11E465cfa5236EFd89e8a4c",
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