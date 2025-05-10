'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

// Smart Contract ABIs for interacting with the blockchain
// VehicleTitleABI: Handles the NFT representation of vehicle titles
const VehicleTitleABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "vin", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "mintTitle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getTitleDetails",
    "outputs": [
      { "internalType": "string", "name": "vin", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// EscrowABI: Manages the escrow process for vehicle title transfers
const EscrowABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "nftAddress", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "buyer", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "createEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositPayment",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifyAndRelease",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "nftAddress", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "EscrowCreated",
    "type": "event"
  }
];

// TODO: Replace these with actual deployed contract addresses
const VEHICLE_TITLE_ADDRESS = "0xYourVehicleTitleContractAddress";
const ESCROW_ADDRESS = "0xYourEscrowContractAddress";
const USDC_ADDRESS = "0xYourUSDCContractAddress";

export default function VehicleEscrow() {
  // State management for wallet connection and user inputs
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [vin, setVin] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  /**
   * Connects to the user's MetaMask wallet
   * Sets up the ethers provider and signer for blockchain interactions
   */
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        const newSigner = newProvider.getSigner();
        setAccount(accounts[0]);
        setProvider(newProvider);
        setSigner(newSigner);
        setStatus("Wallet connected!");
      } catch (error) {
        setStatus(`Error connecting wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      setStatus("MetaMask not detected.");
    }
  };

  /**
   * Mints a new vehicle title NFT
   * Requires: Connected wallet, VIN, and metadata URI
   */
  const mintTitle = async () => {
    if (!signer) {
      setStatus("Please connect wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(VEHICLE_TITLE_ADDRESS, VehicleTitleABI, signer);
      const tx = await contract.mintTitle(account, vin, metadataURI);
      await tx.wait();
      setStatus("Title minted successfully!");
    } catch (error) {
      setStatus(`Error minting title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Creates an escrow agreement for the vehicle title transfer
   * Requires: Connected wallet, buyer address, and payment amount
   */
  const createEscrow = async () => {
    if (!signer) {
      setStatus("Please connect wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(ESCROW_ADDRESS, EscrowABI, signer);
      const tx = await contract.createEscrow(
        VEHICLE_TITLE_ADDRESS,
        1, // TODO: Make tokenId dynamic based on the minted title
        buyerAddress,
        ethers.utils.parseUnits(amount, 6) // USDC has 6 decimals
      );
      await tx.wait();
      setStatus("Escrow created successfully!");
    } catch (error) {
      setStatus(`Error creating escrow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Handles the payment deposit process
   * Includes USDC approval and payment transfer
   */
  const depositPayment = async () => {
    if (!signer) {
      setStatus("Please connect wallet first.");
      return;
    }
    try {
      const usdcContract = new ethers.Contract(USDC_ADDRESS, [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)"
      ], signer);
      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, EscrowABI, signer);
      const amountWei = ethers.utils.parseUnits(amount, 6);
      
      // Check and handle USDC approval
      const allowance = await usdcContract.allowance(account, ESCROW_ADDRESS);
      if (allowance.lt(amountWei)) {
        const approveTx = await usdcContract.approve(ESCROW_ADDRESS, amountWei);
        await approveTx.wait();
      }
      
      const tx = await escrowContract.depositPayment({ value: 0 });
      await tx.wait();
      setStatus("Payment deposited successfully!");
    } catch (error) {
      setStatus(`Error depositing payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Verifies payment and releases the vehicle title to the buyer
   * Can only be called by the seller after payment is confirmed
   */
  const verifyAndRelease = async () => {
    if (!signer) {
      setStatus("Please connect wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(ESCROW_ADDRESS, EscrowABI, signer);
      const tx = await contract.verifyAndRelease();
      await tx.wait();
      setStatus("Escrow completed! Title transferred.");
    } catch (error) {
      setStatus(`Error completing escrow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // UI Components
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold text-white bg-senate-navy p-4 rounded mb-4">Vehicle Escrow MVP</h1>
      <button
        onClick={connectWallet}
        className="bg-senate-navy text-white px-4 py-2 rounded mb-4 hover:bg-senate-navy-hover"
      >
        {account ? `Connected: ${account.slice(0, 6)}...` : "Connect Wallet"}
      </button>
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold text-senate-navy mb-4">Dealership: Mint Title</h2>
        <input
          type="text"
          placeholder="VIN"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="text"
          placeholder="Metadata URI (e.g., IPFS link)"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={mintTitle}
          className="w-full bg-senate-gold text-senate-navy px-4 py-2 rounded hover:bg-senate-gold-hover"
        >
          Mint Title NFT
        </button>
      </div>
      <div className="w-full max-w-md bg-white p-6 rounded shadow mt-4">
        <h2 className="text-xl font-semibold text-senate-navy mb-4">Dealership: Create Escrow</h2>
        <input
          type="text"
          placeholder="Buyer Address"
          value={buyerAddress}
          onChange={(e) => setBuyerAddress(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="text"
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={createEscrow}
          className="w-full bg-senate-navy text-white px-4 py-2 rounded hover:bg-senate-navy-hover"
        >
          Create Escrow
        </button>
      </div>
      <div className="w-full max-w-md bg-white p-6 rounded shadow mt-4">
        <h2 className="text-xl font-semibold text-senate-navy mb-4">Buyer: Deposit Payment</h2>
        <button
          onClick={depositPayment}
          className="w-full bg-senate-gold text-senate-navy px-4 py-2 rounded hover:bg-senate-gold-hover"
        >
          Deposit USDC Payment
        </button>
      </div>
      <div className="w-full max-w-md bg-white p-6 rounded shadow mt-4">
        <h2 className="text-xl font-semibold text-senate-navy mb-4">Dealership: Verify & Release</h2>
        <button
          onClick={verifyAndRelease}
          className="w-full bg-senate-red text-white px-4 py-2 rounded hover:bg-senate-red-hover"
        >
          Verify Payment & Release Title
        </button>
      </div>
      <p className="mt-4 text-senate-red">{status}</p>
    </div>
  );
} 