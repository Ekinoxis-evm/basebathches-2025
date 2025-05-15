// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VehicleNFT
 * @dev Contract for creating and managing vehicle NFTs with public minting capability
 * and owner-only metadata updates
 *
 * IMPORTANT: When creating the metadata for these NFTs, always include:
 * - name: The vehicle name/title 
 * - description: A detailed description of the vehicle (will display on OpenSea)
 * - image: The IPFS URI of the vehicle image
 * - attributes: Including at minimum the "Placa" (license plate) trait
 */
contract VehicleNFT_V2 is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping to track authorized minters
    mapping(address => bool) private _authorizedMinters;
    
    // Events
    event VehicleNFTMinted(address indexed to, uint256 tokenId, string tokenURI);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TokenURIUpdated(uint256 indexed tokenId, string newTokenURI);

    constructor() ERC721("VehicleNFT", "VHCL") Ownable(msg.sender) {}
    
    /**
     * @dev Authorizes an address to mint NFTs
     * @param minter Address to authorize
     */
    function authorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        _authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    /**
     * @dev Revokes an address's minting privileges
     * @param minter Address to revoke
     */
    function revokeMinter(address minter) external onlyOwner {
        require(_authorizedMinters[minter], "Address is not an authorized minter");
        _authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    
    /**
     * @dev Checks if an address is an authorized minter
     * @param minter Address to check
     * @return bool Whether the address is authorized
     */
    function isAuthorizedMinter(address minter) public view returns (bool) {
        return _authorizedMinters[minter];
    }

    /**
     * @dev Owner-only function to mint NFTs
     * @param to Recipient address
     * @param tokenURI URI for the token metadata
     * @return tokenId The new token's ID
     */
    function mintVehicleNFT(
        address to,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        require(bytes(tokenURI).length > 0, "Token URI is required");
        require(to != address(0), "Invalid recipient address");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit VehicleNFTMinted(to, newTokenId, tokenURI);
        return newTokenId;
    }
    
    /**
     * @dev Public function to mint NFTs (for authorized minters only)
     * @param tokenURI URI for the token metadata
     * @return tokenId The new token's ID
     */
    function publicMintVehicleNFT(
        string memory tokenURI
    ) external returns (uint256) {
        require(_authorizedMinters[msg.sender] || owner() == msg.sender, "Not authorized to mint");
        require(bytes(tokenURI).length > 0, "Token URI is required");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit VehicleNFTMinted(msg.sender, newTokenId, tokenURI);
        return newTokenId;
    }
    
    /**
     * @dev Allows token owner to update token metadata
     * @param tokenId ID of the token to update
     * @param newTokenURI New URI for the token metadata
     */
    function updateTokenURI(uint256 tokenId, string memory newTokenURI) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only token owner can update metadata");
        require(bytes(newTokenURI).length > 0, "Token URI is required");
        
        _setTokenURI(tokenId, newTokenURI);
        
        emit TokenURIUpdated(tokenId, newTokenURI);
    }
    
    /**
     * @dev Internal function to check if a token exists
     * @param tokenId ID of the token to check
     * @return bool Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Returns the total number of tokens minted
     * @return uint256 Total tokens minted
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
} 