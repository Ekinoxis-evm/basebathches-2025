// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./EscrowNFT.sol";

/**
 * @title VehicleListingRegistry
 * @dev Contract for registering vehicle listings with extended metadata
 */
contract VehicleListingRegistry is Ownable, ReentrancyGuard {
    // Reference to the EscrowNFT contract
    EscrowNFT public escrowContract;
    
    // Basic vehicle location structure
    struct VehicleLocation {
        string estado;           // New or Used
        string contactoCelular;  // Optional contact phone
        string departamento;     // Required: Colombian department
        string ciudad;           // Required: City
        string direccion;        // Optional detailed address
    }
    
    // Document validation structure
    struct DocumentStatus {
        // SOAT (Mandatory auto insurance)
        string soatEntidad;
        string soatNumeroPoliza;
        uint256 soatFechaExpedicion;
        uint256 soatFechaVigencia;
        bool soatVigente;
        
        // Tecnico Mecanico (Vehicle inspection)
        string rtmEntidad;
        string rtmNumeroCertificado;
        uint256 rtmFechaExpedicion;
        uint256 rtmFechaVigencia;
        bool rtmVigente;
        
        // Peritaje (Vehicle assessment)
        bool tienePertitaje;
        string peritajeEntidad;
        string peritajeDocumentoURI;
        
        // Additional Insurance
        string seguroEntidad;
        string seguroNumeroPoliza;
        uint256 seguroFechaExpedicion;
        uint256 seguroFechaVigencia;
        bool seguroVigente;
    }
    
    // Listing status
    enum ListingStatus { Active, InEscrow, Sold, Cancelled }
    
    // Main vehicle listing structure
    struct VehicleListing {
        address owner;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 escrowId;
        ListingStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        string metadataURI;     // URI to full metadata (IPFS or other storage)
    }
    
    // Mappings to store vehicle data
    mapping(uint256 => VehicleListing) public listings;           // listingId => VehicleListing
    mapping(uint256 => VehicleLocation) public locations;         // listingId => VehicleLocation
    mapping(uint256 => DocumentStatus) public documentStatus;     // listingId => DocumentStatus
    mapping(uint256 => bool) public listingExists;                // listingId => exists
    mapping(address => mapping(uint256 => uint256)) public ownerNFTListings;  // owner => tokenId => listingId
    
    // Counters
    uint256 private _listingIdCounter;
    
    // Events
    event ListingCreated(uint256 indexed listingId, address indexed owner, address indexed nftContract, uint256 tokenId, uint256 price);
    event ListingUpdated(uint256 indexed listingId, address indexed owner, uint256 price, ListingStatus status);
    event EscrowCreated(uint256 indexed listingId, uint256 indexed escrowId);
    event ListingSold(uint256 indexed listingId, address indexed seller, address indexed buyer);
    event ListingCancelled(uint256 indexed listingId);
    event LocationUpdated(uint256 indexed listingId);
    event DocumentsUpdated(uint256 indexed listingId);
    
    /**
     * @dev Constructor sets the address of the EscrowNFT contract
     * @param _escrowContract Address of the EscrowNFT contract
     */
    constructor(address _escrowContract) Ownable(msg.sender) {
        require(_escrowContract != address(0), "Invalid escrow contract address");
        escrowContract = EscrowNFT(_escrowContract);
    }
    
    /**
     * @dev Creates a new vehicle listing
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT
     * @param price Initial listing price
     * @param metadataURI URI to the complete metadata
     * @return listingId The ID of the newly created listing
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        string calldata metadataURI
    ) external nonReentrant returns (uint256) {
        // Verify the caller owns the NFT
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Caller must own the NFT");
        require(price > 0, "Price must be greater than zero");
        
        // Increment listing ID counter
        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;
        
        // Create listing
        listings[listingId] = VehicleListing({
            owner: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            escrowId: 0,
            status: ListingStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            metadataURI: metadataURI
        });
        
        // Mark listing as existing
        listingExists[listingId] = true;
        
        // Track owner's NFT to listing mapping
        ownerNFTListings[msg.sender][tokenId] = listingId;
        
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price);
        
        return listingId;
    }
    
    /**
     * @dev Updates the location information for a vehicle listing
     * @param listingId ID of the listing
     * @param estado Vehicle condition (New/Used)
     * @param contactoCelular Contact phone number
     * @param departamento Colombian department
     * @param ciudad City
     * @param direccion Detailed address
     */
    function updateLocation(
        uint256 listingId,
        string calldata estado,
        string calldata contactoCelular,
        string calldata departamento,
        string calldata ciudad,
        string calldata direccion
    ) external nonReentrant {
        require(listingExists[listingId], "Listing does not exist");
        require(listings[listingId].owner == msg.sender, "Not the listing owner");
        require(listings[listingId].status == ListingStatus.Active, "Listing not active");
        
        // Validate required fields
        require(bytes(estado).length > 0, "Estado is required");
        require(bytes(departamento).length > 0, "Departamento is required");
        require(bytes(ciudad).length > 0, "Ciudad is required");
        
        // Update location
        locations[listingId] = VehicleLocation({
            estado: estado,
            contactoCelular: contactoCelular,
            departamento: departamento,
            ciudad: ciudad,
            direccion: direccion
        });
        
        // Update listing timestamp
        listings[listingId].updatedAt = block.timestamp;
        
        emit LocationUpdated(listingId);
    }
    
    /**
     * @dev Updates the document status for a vehicle listing
     * @param listingId ID of the listing
     */
    function updateDocuments(
        uint256 listingId,
        // SOAT parameters
        string calldata soatEntidad,
        string calldata soatNumeroPoliza,
        uint256 soatFechaExpedicion,
        uint256 soatFechaVigencia,
        // RTM parameters
        string calldata rtmEntidad,
        string calldata rtmNumeroCertificado,
        uint256 rtmFechaExpedicion,
        uint256 rtmFechaVigencia,
        // Peritaje parameters
        bool tienePertitaje,
        string calldata peritajeEntidad,
        string calldata peritajeDocumentoURI,
        // Additional insurance parameters
        string calldata seguroEntidad,
        string calldata seguroNumeroPoliza,
        uint256 seguroFechaExpedicion,
        uint256 seguroFechaVigencia
    ) external nonReentrant {
        require(listingExists[listingId], "Listing does not exist");
        require(listings[listingId].owner == msg.sender, "Not the listing owner");
        require(listings[listingId].status == ListingStatus.Active, "Listing not active");
        
        // Validate SOAT fields
        require(bytes(soatEntidad).length > 0, "SOAT entidad is required");
        require(bytes(soatNumeroPoliza).length > 0, "SOAT numero de poliza is required");
        require(soatFechaExpedicion > 0, "SOAT fecha expedicion is required");
        require(soatFechaVigencia > 0, "SOAT fecha vigencia is required");
        require(soatFechaVigencia > soatFechaExpedicion, "SOAT: Invalid dates");
        
        // Validate RTM fields
        require(bytes(rtmEntidad).length > 0, "RTM entidad is required");
        require(bytes(rtmNumeroCertificado).length > 0, "RTM numero certificado is required");
        require(rtmFechaExpedicion > 0, "RTM fecha expedicion is required");
        require(rtmFechaVigencia > 0, "RTM fecha vigencia is required");
        require(rtmFechaVigencia > rtmFechaExpedicion, "RTM: Invalid dates");
        
        // Calculate validity
        bool soatVigente = (block.timestamp > soatFechaExpedicion && block.timestamp < soatFechaVigencia);
        bool rtmVigente = (block.timestamp > rtmFechaExpedicion && block.timestamp < rtmFechaVigencia);
        bool seguroVigente = false;
        
        // Calculate additional insurance validity if provided
        if (bytes(seguroEntidad).length > 0 && bytes(seguroNumeroPoliza).length > 0 && 
            seguroFechaExpedicion > 0 && seguroFechaVigencia > 0) {
            seguroVigente = (block.timestamp > seguroFechaExpedicion && block.timestamp < seguroFechaVigencia);
        }
        
        // Update document status
        documentStatus[listingId] = DocumentStatus({
            soatEntidad: soatEntidad,
            soatNumeroPoliza: soatNumeroPoliza,
            soatFechaExpedicion: soatFechaExpedicion,
            soatFechaVigencia: soatFechaVigencia,
            soatVigente: soatVigente,
            
            rtmEntidad: rtmEntidad,
            rtmNumeroCertificado: rtmNumeroCertificado,
            rtmFechaExpedicion: rtmFechaExpedicion,
            rtmFechaVigencia: rtmFechaVigencia,
            rtmVigente: rtmVigente,
            
            tienePertitaje: tienePertitaje,
            peritajeEntidad: peritajeEntidad,
            peritajeDocumentoURI: peritajeDocumentoURI,
            
            seguroEntidad: seguroEntidad,
            seguroNumeroPoliza: seguroNumeroPoliza,
            seguroFechaExpedicion: seguroFechaExpedicion,
            seguroFechaVigencia: seguroFechaVigencia,
            seguroVigente: seguroVigente
        });
        
        // Update listing timestamp
        listings[listingId].updatedAt = block.timestamp;
        
        emit DocumentsUpdated(listingId);
    }
    
    /**
     * @dev Updates the price of a listing
     * @param listingId ID of the listing
     * @param newPrice New price for the listing
     */
    function updatePrice(uint256 listingId, uint256 newPrice) external nonReentrant {
        require(listingExists[listingId], "Listing does not exist");
        require(listings[listingId].owner == msg.sender, "Not the listing owner");
        require(listings[listingId].status == ListingStatus.Active, "Listing not active");
        require(newPrice > 0, "Price must be greater than zero");
        
        listings[listingId].price = newPrice;
        listings[listingId].updatedAt = block.timestamp;
        
        emit ListingUpdated(listingId, msg.sender, newPrice, listings[listingId].status);
    }
    
    /**
     * @dev Creates an escrow for a listing
     * @param listingId ID of the listing
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(uint256 listingId) external nonReentrant returns (uint256) {
        require(listingExists[listingId], "Listing does not exist");
        require(listings[listingId].owner == msg.sender, "Not the listing owner");
        require(listings[listingId].status == ListingStatus.Active, "Listing not active");
        
        VehicleListing storage listing = listings[listingId];
        
        // Call the EscrowNFT contract to create an escrow
        uint256 escrowId = escrowContract.createEscrow(
            listing.nftContract,
            listing.tokenId,
            address(0), // Use default payment token (BCOP)
            listing.price
        );
        
        // Update listing state
        listing.escrowId = escrowId;
        listing.status = ListingStatus.InEscrow;
        listing.updatedAt = block.timestamp;
        
        emit EscrowCreated(listingId, escrowId);
        
        return escrowId;
    }
    
    /**
     * @dev Mark a listing as sold (to be called after escrow completion)
     * @param listingId ID of the listing
     * @param buyer Address of the buyer
     */
    function markAsSold(uint256 listingId, address buyer) external nonReentrant {
        require(listingExists[listingId], "Listing does not exist");
        require(listings[listingId].status == ListingStatus.InEscrow, "Listing not in escrow");
        
        // Only the escrow contract or owner can mark as sold
        require(
            msg.sender == address(escrowContract) || 
            msg.sender == owner() || 
            msg.sender == listings[listingId].owner,
            "Not authorized"
        );
        
        VehicleListing storage listing = listings[listingId];
        listing.status = ListingStatus.Sold;
        listing.updatedAt = block.timestamp;
        
        emit ListingSold(listingId, listing.owner, buyer);
    }
    
    /**
     * @dev Cancel a listing
     * @param listingId ID of the listing
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        require(listingExists[listingId], "Listing does not exist");
        require(
            listings[listingId].owner == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        require(listings[listingId].status == ListingStatus.Active, "Listing not active");
        
        listings[listingId].status = ListingStatus.Cancelled;
        listings[listingId].updatedAt = block.timestamp;
        
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Gets all details for a listing ID
     * @param listingId ID of the listing
     */
    function getFullListingDetails(uint256 listingId) external view returns (
        VehicleListing memory listing,
        VehicleLocation memory location,
        DocumentStatus memory documents
    ) {
        require(listingExists[listingId], "Listing does not exist");
        
        return (
            listings[listingId],
            locations[listingId],
            documentStatus[listingId]
        );
    }
    
    /**
     * @dev Gets the current listing count
     */
    function getCurrentListingId() external view returns (uint256) {
        return _listingIdCounter;
    }
    
    /**
     * @dev Update the escrow contract address (admin only)
     * @param _newEscrowContract New escrow contract address
     */
    function updateEscrowContract(address _newEscrowContract) external onlyOwner {
        require(_newEscrowContract != address(0), "Invalid escrow contract address");
        escrowContract = EscrowNFT(_newEscrowContract);
    }
} 