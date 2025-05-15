// Contract addresses
export const CONTRACT_ADDRESSES = {
  VehicleNFT: "0x1C4cc777E309c6403Ce82e2332887470773A8a74",
  VehicleNFT_V2: "0x1C4cc777E309c6403Ce82e2332887470773A8a74",
  EscrowNFT: "0x1234567890123456789012345678901234567890",
  Lock: "0x69eC6B0a1Fdd51736cb6CAe283D790ED6AF3ddf5"
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