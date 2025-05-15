// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowNFT
 * @dev Contract for facilitating NFT sales via escrow with stablecoin payments
 */
contract EscrowNFT is Ownable, ReentrancyGuard {
    // Default BCOP token address on Base Sepolia
    address public constant DEFAULT_PAYMENT_TOKEN = 0x34Fa1aED9f275451747f3e9B5377608cCF96A458;
    
    // Escrow state
    enum EscrowState { Created, BuyerDeposited, Accepted, Completed, Cancelled }
    
    // Escrow structure
    struct Escrow {
        address seller;
        address nftContract;
        uint256 tokenId;
        address paymentToken;
        uint256 price;
        address buyer;
        EscrowState state;
        bool sellerSigned;
        bool buyerSigned;
    }
    
    // Mapping from escrow ID to Escrow details
    mapping(uint256 => Escrow) public escrows;
    
    // Counter for generating unique escrow IDs
    uint256 private _escrowIdCounter;
    
    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    );
    
    event BuyerAssigned(uint256 indexed escrowId, address indexed buyer);
    event PaymentDeposited(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event NFTDeposited(uint256 indexed escrowId, address indexed seller, uint256 tokenId);
    event EscrowAccepted(uint256 indexed escrowId, bool sellerAccepted, bool buyerAccepted);
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new escrow for an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT
     * @param paymentToken Address of the payment token (default to BCOP if zero address)
     * @param price Price in payment token (with decimals)
     */
    function createEscrow(
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(nftContract != address(0), "Invalid NFT contract address");
        require(price > 0, "Price must be greater than zero");
        
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
            state: EscrowState.Created,
            sellerSigned: false,
            buyerSigned: false
        });
        
        // Transfer NFT to this contract
        nft.transferFrom(msg.sender, address(this), tokenId);
        
        emit EscrowCreated(escrowId, msg.sender, nftContract, tokenId, paymentToken, price);
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
        
        // Assign buyer
        escrow.buyer = msg.sender;
        
        emit BuyerAssigned(escrowId, msg.sender);
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
        
        IERC20 token = IERC20(escrow.paymentToken);
        uint256 amount = escrow.price;
        
        // Transfer tokens to this contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Update escrow state
        escrow.state = EscrowState.BuyerDeposited;
        
        emit PaymentDeposited(escrowId, msg.sender, amount);
    }
    
    /**
     * @dev Signs acceptance of the escrow terms
     * @param escrowId ID of the escrow
     * @param accept Whether to accept or reject
     */
    function signEscrow(uint256 escrowId, bool accept) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state == EscrowState.BuyerDeposited, "Buyer must deposit first");
        require(msg.sender == escrow.seller || msg.sender == escrow.buyer, "Not a party to this escrow");
        
        if (!accept) {
            // If either party rejects, cancel the escrow
            _cancelEscrow(escrowId);
            return;
        }
        
        // Update signatures
        if (msg.sender == escrow.seller) {
            escrow.sellerSigned = true;
        } else {
            escrow.buyerSigned = true;
        }
        
        emit EscrowAccepted(escrowId, escrow.sellerSigned, escrow.buyerSigned);
        
        // If both parties have accepted, complete the escrow
        if (escrow.sellerSigned && escrow.buyerSigned) {
            _completeEscrow(escrowId);
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
     */
    function _cancelEscrow(uint256 escrowId) internal {
        Escrow storage escrow = escrows[escrowId];
        
        // Return NFT to seller
        IERC721(escrow.nftContract).transferFrom(address(this), escrow.seller, escrow.tokenId);
        
        // Return payment to buyer if deposited
        if (escrow.state == EscrowState.BuyerDeposited) {
            IERC20(escrow.paymentToken).transfer(escrow.buyer, escrow.price);
        }
        
        // Update escrow state
        escrow.state = EscrowState.Cancelled;
        
        emit EscrowCancelled(escrowId);
    }
    
    /**
     * @dev Force cancels an escrow (only for admin/emergency use)
     * @param escrowId ID of the escrow
     */
    function adminCancelEscrow(uint256 escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.seller != address(0), "Escrow does not exist");
        require(escrow.state != EscrowState.Completed && escrow.state != EscrowState.Cancelled, 
                "Escrow already completed or cancelled");
        
        _cancelEscrow(escrowId);
    }
    
    /**
     * @dev Gets details of an escrow
     * @param escrowId ID of the escrow
     * @return Full escrow details
     */
    function getEscrowDetails(uint256 escrowId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        address paymentToken,
        uint256 price,
        address buyer,
        EscrowState state,
        bool sellerSigned,
        bool buyerSigned
    ) {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.seller,
            escrow.nftContract,
            escrow.tokenId,
            escrow.paymentToken,
            escrow.price,
            escrow.buyer,
            escrow.state,
            escrow.sellerSigned,
            escrow.buyerSigned
        );
    }
    
    /**
     * @dev Gets the latest escrow ID
     * @return Current escrow ID counter
     */
    function getCurrentEscrowId() external view returns (uint256) {
        return _escrowIdCounter;
    }
}
