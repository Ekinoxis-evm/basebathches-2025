// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SignatureEscrow
 * @dev Enhanced escrow contract for NFT trading using EIP-712 signatures
 * Allows for gasless approvals and multi-party signatures
 */
contract SignatureEscrow is EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // Default BCOP token address on Base Sepolia
    address public constant DEFAULT_PAYMENT_TOKEN = 0x34Fa1aED9f275451747f3e9B5377608cCF96A458;
    
    // Escrow state
    enum EscrowState { Created, BuyerDeposited, ReadyForExecution, Completed, Cancelled }
    
    // Transaction types
    enum TransactionType { CompleteEscrow, CancelEscrow }
    
    // Required signatures structure
    struct RequiredSignatures {
        bool requireBuyer;
        bool requireSeller;
        bool requireArbiter;
        uint8 threshold;     // Number of signatures required (1-3)
    }
    
    // Escrow structure
    struct Escrow {
        address seller;
        address nftContract;
        uint256 tokenId;
        address paymentToken;
        uint256 price;
        address buyer;
        address arbiter;     // Optional third party for dispute resolution
        EscrowState state;
        RequiredSignatures requiredSignatures;
        uint256 expirationTime;  // Optional: Escrow expiration timestamp
    }
    
    // Transaction approval tracking
    struct Transaction {
        uint256 escrowId;
        TransactionType txType;
        uint256 nonce;
        mapping(address => bool) approvals;
        uint8 approvalCount;
    }
    
    // Mappings
    mapping(uint256 => Escrow) public escrows;
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => uint256) public userNonces;
    
    // Counter for generating unique escrow IDs
    uint256 private _escrowIdCounter;
    
    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price,
        address arbiter
    );
    
    event BuyerAssigned(uint256 indexed escrowId, address indexed buyer);
    event PaymentDeposited(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event NFTDeposited(uint256 indexed escrowId, address indexed seller, uint256 tokenId);
    event TransactionApproved(uint256 indexed escrowId, address indexed signer, TransactionType indexed txType);
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId, string reason);
    event ArbiterAssigned(uint256 indexed escrowId, address indexed arbiter);
    
    /**
     * @dev Constructor initializes EIP712 domain separator
     */
    constructor() EIP712("SignatureEscrow", "1.0.0") Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new escrow with signature requirements
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT
     * @param paymentToken Address of the payment token (default to BCOP if zero address)
     * @param price Price in payment token (with decimals)
     * @param arbiter Optional address for dispute resolution
     * @param requireBuyer Whether buyer signature is required
     * @param requireSeller Whether seller signature is required
     * @param requireArbiter Whether arbiter signature is required
     * @param threshold Number of signatures required (must be <= number of required signers)
     * @param expirationTime Optional timestamp when escrow expires (0 for no expiration)
     */
    function createEscrow(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price,
        address arbiter,
        bool requireBuyer,
        bool requireSeller,
        bool requireArbiter,
        uint8 threshold,
        uint256 expirationTime
    ) external nonReentrant returns (uint256) {
        require(nftContract != address(0), "Invalid NFT contract address");
        require(price > 0, "Price must be greater than zero");
        
        // Validate signature requirements
        uint8 maxSigners = 0;
        if (requireBuyer) maxSigners++;
        if (requireSeller) maxSigners++;
        if (requireArbiter) {
            maxSigners++;
            require(arbiter != address(0), "Arbiter required but not provided");
        }
        
        require(threshold > 0 && threshold <= maxSigners, "Invalid threshold");
        
        // Verify the caller owns the NFT
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Caller must own the NFT");
        
        // Increment escrow ID counter
        _escrowIdCounter++;
        uint256 escrowId = _escrowIdCounter;
        
        // Use default payment token if none specified
        if (paymentToken == address(0)) {
            paymentToken = DEFAULT_PAYMENT_TOKEN;
        }
        
        // Create new escrow
        escrows[escrowId] = Escrow({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            paymentToken: paymentToken,
            price: price,
            buyer: address(0),
            arbiter: arbiter,
            state: EscrowState.Created,
            requiredSignatures: RequiredSignatures({
                requireBuyer: requireBuyer,
                requireSeller: requireSeller,
                requireArbiter: requireArbiter,
                threshold: threshold
            }),
            expirationTime: expirationTime
        });
        
        // Transfer NFT to this contract
        nft.transferFrom(msg.sender, address(this), tokenId);
        
        emit EscrowCreated(escrowId, msg.sender, nftContract, tokenId, paymentToken, price, arbiter);
        emit NFTDeposited(escrowId, msg.sender, tokenId);
        
        return escrowId;
    }
    
    /**
     * @dev Assigns a buyer to an escrow
     * @param escrowId ID of the escrow
     */
    function assignAsBuyer(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state == EscrowState.Created, "Escrow not in Created state");
        require(escrow.seller != msg.sender, "Seller cannot be buyer");
        require(escrow.buyer == address(0), "Buyer already assigned");
        
        // Check if escrow is expired
        if (escrow.expirationTime > 0) {
            require(block.timestamp <= escrow.expirationTime, "Escrow expired");
        }
        
        // Assign buyer
        escrow.buyer = msg.sender;
        
        emit BuyerAssigned(escrowId, msg.sender);
    }
    
    /**
     * @dev Assigns an arbiter to an escrow (if not already assigned during creation)
     * @param escrowId ID of the escrow
     * @param arbiter Address of the arbiter
     */
    function assignArbiter(uint256 escrowId, address arbiter) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state == EscrowState.Created || escrow.state == EscrowState.BuyerDeposited, 
                "Escrow in wrong state");
        require(msg.sender == escrow.seller, "Only seller can assign arbiter");
        require(arbiter != address(0), "Invalid arbiter address");
        require(arbiter != escrow.seller && arbiter != escrow.buyer, "Arbiter cannot be buyer or seller");
        require(escrow.arbiter == address(0), "Arbiter already assigned");
        
        // Check if escrow is expired
        if (escrow.expirationTime > 0) {
            require(block.timestamp <= escrow.expirationTime, "Escrow expired");
        }
        
        // Assign arbiter
        escrow.arbiter = arbiter;
        
        emit ArbiterAssigned(escrowId, arbiter);
    }
    
    /**
     * @dev Deposits payment from the buyer
     * @param escrowId ID of the escrow
     */
    function depositPayment(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state == EscrowState.Created, "Escrow not in Created state");
        require(escrow.buyer == msg.sender, "Only assigned buyer can deposit");
        
        // Check if escrow is expired
        if (escrow.expirationTime > 0) {
            require(block.timestamp <= escrow.expirationTime, "Escrow expired");
        }
        
        IERC20 token = IERC20(escrow.paymentToken);
        uint256 amount = escrow.price;
        
        // Transfer tokens to this contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Update escrow state
        escrow.state = EscrowState.BuyerDeposited;
        
        // If no signatures are needed, mark as ready for execution
        if (escrow.requiredSignatures.threshold == 0) {
            escrow.state = EscrowState.ReadyForExecution;
        }
        
        emit PaymentDeposited(escrowId, msg.sender, amount);
    }
    
    /**
     * @dev Generates a typed data hash according to EIP-712 for a transaction
     * @param escrowId ID of the escrow
     * @param txType Type of transaction (complete or cancel)
     * @param nonce User's current nonce
     * @return Typed data hash that needs to be signed
     */
    function _hashTypedDataV4ForTransaction(
        uint256 escrowId,
        TransactionType txType,
        uint256 nonce
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("EscrowTransaction(uint256 escrowId,uint8 transactionType,uint256 nonce)"),
                    escrowId,
                    uint8(txType),
                    nonce
                )
            )
        );
    }
    
    /**
     * @dev Approves a transaction with direct signature
     * @param escrowId ID of the escrow
     * @param txType Type of transaction (complete or cancel)
     */
    function approveTransaction(uint256 escrowId, TransactionType txType) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state == EscrowState.BuyerDeposited, "Escrow not in BuyerDeposited state");
        
        // Check if escrow is expired
        if (escrow.expirationTime > 0 && block.timestamp > escrow.expirationTime) {
            _cancelEscrow(escrowId, "Escrow expired");
            return;
        }
        
        // Verify the caller is authorized
        bool isAuthorized = false;
        if ((escrow.requiredSignatures.requireSeller && msg.sender == escrow.seller) ||
            (escrow.requiredSignatures.requireBuyer && msg.sender == escrow.buyer) ||
            (escrow.requiredSignatures.requireArbiter && msg.sender == escrow.arbiter)) {
            isAuthorized = true;
        }
        
        require(isAuthorized, "Not authorized to approve");
        
        // Create transaction hash
        uint256 nonce = userNonces[msg.sender]++;
        bytes32 txHash = _hashTypedDataV4ForTransaction(escrowId, txType, nonce);
        
        // Get or create transaction record
        Transaction storage transaction = transactions[txHash];
        
        // If this is a new transaction, initialize it
        if (transaction.nonce == 0) {
            transaction.escrowId = escrowId;
            transaction.txType = txType;
            transaction.nonce = nonce;
            transaction.approvalCount = 0;
        }
        
        // Record approval if not already approved
        if (!transaction.approvals[msg.sender]) {
            transaction.approvals[msg.sender] = true;
            transaction.approvalCount++;
            
            emit TransactionApproved(escrowId, msg.sender, txType);
            
            // Check if threshold is reached
            if (transaction.approvalCount >= escrow.requiredSignatures.threshold) {
                // Execute the transaction
                if (txType == TransactionType.CompleteEscrow) {
                    _completeEscrow(escrowId);
                } else if (txType == TransactionType.CancelEscrow) {
                    _cancelEscrow(escrowId, "Cancelled by signers");
                }
            }
        }
    }
    
    /**
     * @dev Approves a transaction with off-chain signature
     * @param escrowId ID of the escrow
     * @param txType Type of transaction (complete or cancel)
     * @param signer Address of the signer
     * @param nonce Nonce used in the signature
     * @param signature EIP-712 signature
     */
    function approveTransactionWithSignature(
        uint256 escrowId,
        TransactionType txType,
        address signer,
        uint256 nonce,
        bytes memory signature
    ) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state == EscrowState.BuyerDeposited, "Escrow not in BuyerDeposited state");
        
        // Check if escrow is expired
        if (escrow.expirationTime > 0 && block.timestamp > escrow.expirationTime) {
            _cancelEscrow(escrowId, "Escrow expired");
            return;
        }
        
        // Verify the signer is authorized
        bool isAuthorized = false;
        if ((escrow.requiredSignatures.requireSeller && signer == escrow.seller) ||
            (escrow.requiredSignatures.requireBuyer && signer == escrow.buyer) ||
            (escrow.requiredSignatures.requireArbiter && signer == escrow.arbiter)) {
            isAuthorized = true;
        }
        
        require(isAuthorized, "Signer not authorized");
        require(nonce == userNonces[signer], "Invalid nonce");
        
        // Verify signature
        bytes32 txHash = _hashTypedDataV4ForTransaction(escrowId, txType, nonce);
        address recoveredSigner = ECDSA.recover(txHash, signature);
        require(recoveredSigner == signer, "Invalid signature");
        
        // Increment nonce
        userNonces[signer]++;
        
        // Get or create transaction record
        Transaction storage transaction = transactions[txHash];
        
        // If this is a new transaction, initialize it
        if (transaction.nonce == 0) {
            transaction.escrowId = escrowId;
            transaction.txType = txType;
            transaction.nonce = nonce;
            transaction.approvalCount = 0;
        }
        
        // Record approval if not already approved
        if (!transaction.approvals[signer]) {
            transaction.approvals[signer] = true;
            transaction.approvalCount++;
            
            emit TransactionApproved(escrowId, signer, txType);
            
            // Check if threshold is reached
            if (transaction.approvalCount >= escrow.requiredSignatures.threshold) {
                // Execute the transaction
                if (txType == TransactionType.CompleteEscrow) {
                    _completeEscrow(escrowId);
                } else if (txType == TransactionType.CancelEscrow) {
                    _cancelEscrow(escrowId, "Cancelled by signers");
                }
            }
        }
    }
    
    /**
     * @dev Completes the escrow by transferring assets to respective parties
     * @param escrowId ID of the escrow
     */
    function _completeEscrow(uint256 escrowId) internal {
        Escrow storage escrow = escrows[escrowId];
        
        // Transfer NFT to buyer
        IERC721(escrow.nftContract).transferFrom(address(this), escrow.buyer, escrow.tokenId);
        
        // Transfer payment to seller
        IERC20(escrow.paymentToken).transfer(escrow.seller, escrow.price);
        
        // Update escrow state
        escrow.state = EscrowState.Completed;
        
        emit EscrowCompleted(escrowId);
    }
    
    /**
     * @dev Cancels the escrow and returns assets to original owners
     * @param escrowId ID of the escrow
     * @param reason Reason for cancellation
     */
    function _cancelEscrow(uint256 escrowId, string memory reason) internal {
        Escrow storage escrow = escrows[escrowId];
        
        // Return NFT to seller
        IERC721(escrow.nftContract).transferFrom(address(this), escrow.seller, escrow.tokenId);
        
        // Return payment to buyer if deposited
        if (escrow.state == EscrowState.BuyerDeposited) {
            IERC20(escrow.paymentToken).transfer(escrow.buyer, escrow.price);
        }
        
        // Update escrow state
        escrow.state = EscrowState.Cancelled;
        
        emit EscrowCancelled(escrowId, reason);
    }
    
    /**
     * @dev Force cancels an escrow (only for admin/emergency use)
     * @param escrowId ID of the escrow
     * @param reason Reason for cancellation
     */
    function adminCancelEscrow(uint256 escrowId, string calldata reason) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state != EscrowState.Completed && escrow.state != EscrowState.Cancelled, 
                "Escrow already completed or cancelled");
        
        _cancelEscrow(escrowId, reason);
    }
    
    /**
     * @dev Gets details of an escrow
     * @param escrowId ID of the escrow
     * @return seller The address of the seller
     * @return nftContract The address of the NFT contract
     * @return tokenId The ID of the NFT
     * @return paymentToken The address of the payment token
     * @return price The price in payment token
     * @return buyer The address of the buyer (if assigned)
     * @return arbiter The address of the arbiter (if assigned)
     * @return state The escrow state
     * @return requireBuyer Whether buyer signature is required
     * @return requireSeller Whether seller signature is required
     * @return requireArbiter Whether arbiter signature is required
     * @return threshold The required number of signatures
     * @return expirationTime The escrow expiration timestamp (0 for no expiration)
     */
    function getEscrowDetails(uint256 escrowId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price,
        address buyer,
        address arbiter,
        EscrowState state,
        bool requireBuyer,
        bool requireSeller,
        bool requireArbiter,
        uint8 threshold,
        uint256 expirationTime
    ) {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.seller,
            escrow.nftContract,
            escrow.tokenId,
            escrow.paymentToken,
            escrow.price,
            escrow.buyer,
            escrow.arbiter,
            escrow.state,
            escrow.requiredSignatures.requireBuyer,
            escrow.requiredSignatures.requireSeller,
            escrow.requiredSignatures.requireArbiter,
            escrow.requiredSignatures.threshold,
            escrow.expirationTime
        );
    }
    
    /**
     * @dev Gets the domain separator for EIP-712 signatures
     * @return Domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    /**
     * @dev Gets the latest escrow ID
     * @return Current escrow ID counter
     */
    function getCurrentEscrowId() external view returns (uint256) {
        return _escrowIdCounter;
    }
    
    /**
     * @dev Gets the current nonce for a user
     * @param user Address of the user
     * @return Current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }
    
    /**
     * @dev Creates metadata for the transaction that needs to be signed
     * @param escrowId ID of the escrow
     * @param txType Type of transaction (complete or cancel)
     * @return Domain separator, hash struct, and typed data hash
     */
    function getTransactionHashData(uint256 escrowId, TransactionType txType) external view returns (
        bytes32 domainSeparator,
        bytes32 hashStruct,
        bytes32 typedDataHash
    ) {
        uint256 nonce = userNonces[msg.sender];
        bytes32 typeHash = keccak256("EscrowTransaction(uint256 escrowId,uint8 transactionType,uint256 nonce)");
        bytes32 structHash = keccak256(abi.encode(typeHash, escrowId, uint8(txType), nonce));
        
        return (
            _domainSeparatorV4(),
            structHash,
            _hashTypedDataV4(structHash)
        );
    }
} 