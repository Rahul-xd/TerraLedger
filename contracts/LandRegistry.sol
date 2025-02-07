// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseRegistry.sol";
import "./StringUtils.sol";
import "./UserRegistry.sol"; // Add this import

contract LandRegistry is BaseRegistry {
    using StringUtils for string;

    // Rename the state variable to avoid conflict
    UserRegistry private _userRegistryInstance;

    // Land Management
    uint256 private landIdCounter;
    mapping(uint256 => Land) public lands;
    mapping(address => uint256[]) public userLands;
    mapping(uint256 => LandMetadata) public landMetadata;
    mapping(uint256 => LandHistory[]) public landHistories;
    mapping(uint256 => uint256) private landToArrayIndex;
    mapping(uint256 => bool) private usedPIDs;
    uint256 public constant MAX_DOCUMENTS_PER_LAND = 50;
    uint256 public constant MAX_HISTORY_PER_LAND = 100;

    // Add new mapping for unique survey numbers
    mapping(string => bool) private usedSurveyNumbers;

    // Add mapping for authorized contracts
    mapping(address => bool) public authorizedContracts;

    // Events
    event LandAdded(uint256 indexed landId, address indexed owner);
    event LandVerified(uint256 indexed landId);
    event LandUpdated(
        uint256 indexed landId,
        LandUpdateType updateType,
        string details,
        uint256 newValue
    );
    event LandRemoved(uint256 indexed landId);
    event DocumentAdded(uint256 indexed landId, bytes32 documentHash);
    // Add event for contract authorization
    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);

    // Add events for better tracking
    event LandVerificationFailed(uint256 indexed landId, string reason);
    event LandTransferFailed(uint256 indexed landId, string reason);

    // Add event for rejection
    event LandRejected(uint256 indexed landId, string reason);

    // Add error codes
    error InvalidLand(uint256 landId);
    error UnauthorizedTransfer(address caller);
    error VerificationFailed(string reason);
    // Add new error
    error DuplicateSurveyNumber(string surveyNumber);

    enum LandUpdateType {
        STATUS,
        SALE,
        DETAILS,
        PRICE
    }

    struct Land {
        uint256 id;
        uint256 area;
        string location;
        uint256 price; // Price stored in Wei
        string coordinates;
        uint256 propertyPID;
        string surveyNumber;
        bytes32 documentHash;
        bool isForSale;
        address payable owner;
        bool isVerified;
        string verificationRemark; // Add this field to store verification/rejection reason
    }

    struct LandMetadata {
        bytes32[] additionalDocuments; // Array of IPFS hashes for additional docs
        string[] documentDescriptions; // Descriptions for each document
        uint256 lastUpdated; // Last update timestamp
    }

    struct LandHistory {
        address previousOwner;
        address newOwner;
        uint256 price;
        uint256 timestamp;
        bytes32 documentHash;
        string description;
    }

    // Modifiers
    modifier validLandOwner(uint256 _landId) {
        require(lands[_landId].owner == msg.sender, "Not the land owner");
        require(lands[_landId].isVerified, "Land not verified");
        _;
    }

    modifier validLandId(uint256 _landId) {
        require(_landId > 0, "Invalid land ID");
        _;
    }

    modifier validPrice(uint256 _price) {
        require(_price > 0, "Price must be greater than 0");
        require(_price <= type(uint256).max / 2, "Price too high");
        _;
    }

    modifier validateInput(string memory str) {
        require(str.validateStringLength(1000), "String too long");
        require(bytes(str).length > 0, "Empty string not allowed");
        _;
    }

    constructor(address _userRegistry) {
        _userRegistryInstance = UserRegistry(_userRegistry);
    }

    // Land Management Functions
    function addLand(
        uint256 _area,
        string memory _location,
        uint256 _price, // Price in Wei
        string memory _coordinates,
        uint256 _propertyPID,
        string memory _surveyNumber,
        bytes32 _documentHash
    ) external {
        require(
            _userRegistryInstance.checkRole(
                _userRegistryInstance.VERIFIED_USER_ROLE(),
                msg.sender
            ),
            "Not a verified user"
        );

        _validateLandInputs(
            _area,
            _location,
            _coordinates,
            _surveyNumber,
            _documentHash,
            _propertyPID
        );

        // Mark survey number as used
        usedSurveyNumbers[_surveyNumber] = true;

        landIdCounter++;

        Land memory newLand = Land({
            id: landIdCounter,
            area: _area,
            location: _location,
            price: _price, // Store price in Wei
            coordinates: _coordinates,
            propertyPID: _propertyPID,
            surveyNumber: _surveyNumber,
            documentHash: _documentHash,
            isForSale: false,
            owner: payable(msg.sender),
            isVerified: false,
            verificationRemark: "" // Initialize the new field
        });

        lands[landIdCounter] = newLand;
        userLands[msg.sender].push(landIdCounter);
        usedPIDs[_propertyPID] = true;

        // Make sure this event is emitted
        emit LandAdded(landIdCounter, msg.sender);
    }

    // Internal validation function to reduce bytecode size
    function _validateLandInputs(
        uint256 _area,
        string memory _location,
        string memory _coordinates,
        string memory _surveyNumber,
        bytes32 _documentHash,
        uint256 _propertyPID
    ) internal view {
        require(_area > 0, "Area must be greater than 0");
        require(bytes(_location).length > 0, "Location required");
        require(bytes(_coordinates).length > 0, "Coordinates required");
        require(bytes(_surveyNumber).length > 0, "Survey number required");
        require(_documentHash != bytes32(0), "Document hash required");
        require(_propertyPID > 0, "Invalid PID");
        require(!usedPIDs[_propertyPID], "PID already exists");
        // Add survey number check
        require(
            !usedSurveyNumbers[_surveyNumber],
            "Survey number already exists"
        );
    }

    // Update verifyLand function to be more robust
    function verifyLand(
        uint256 _landId,
        bool isApproved,
        string memory _reason
    ) public onlyRole(INSPECTOR_ROLE) {
        // Input validation
        require(_landId > 0 && _landId <= landIdCounter, "Invalid land ID");

        // Only require reason for rejection
        if (!isApproved) {
            require(bytes(_reason).length > 0, "Rejection reason required");
            require(bytes(_reason).length <= 1000, "Reason too long");
        }

        Land storage land = lands[_landId];
        require(land.id != 0, "Land does not exist");
        require(!land.isVerified, "Land already verified");

        // Validate required fields
        if (isApproved) {
            require(
                land.documentHash != bytes32(0) &&
                    land.propertyPID != 0 &&
                    bytes(land.surveyNumber).length > 0,
                "Invalid land documents"
            );
        }

        // Only store remark if rejecting
        if (!isApproved) {
            // Clean up old identifiers first
            _cleanupRejectedLand(_landId);

            // Store rejection reason
            land.verificationRemark = _reason;
            land.isVerified = false;

            emit LandRejected(_landId, _reason);
        }

        if (isApproved) {
            land.isVerified = true;
            emit LandVerified(_landId);
        } else {
            land.isVerified = false;
            _cleanupRejectedLand(_landId);
            emit LandRejected(_landId, _reason);
        }

        // Record verification in history
        _recordLandHistory(
            _landId,
            land.owner,
            land.owner,
            land.price,
            land.documentHash,
            isApproved ? "Land verified" : _reason
        );
    }

    // Add new function for rejected land cleanup
    function _cleanupRejectedLand(uint256 landId) internal {
        Land storage land = lands[landId];

        // Store old values before cleanup
        uint256 oldPID = land.propertyPID;
        string memory oldSurveyNumber = land.surveyNumber;

        // Free up the identifiers for reuse
        delete usedPIDs[oldPID];
        delete usedSurveyNumbers[oldSurveyNumber];

        // Reset unique identifiers
        land.propertyPID = 0;
        land.surveyNumber = "";

        // Mark land as rejected but keep other details
        land.isVerified = false;
    }

    function batchVerifyLands(
        uint256[] calldata landIds
    ) external onlyRole(INSPECTOR_ROLE) {
        for (uint i = 0; i < landIds.length; ) {
            if (!lands[landIds[i]].isVerified) {
                lands[landIds[i]].isVerified = true;
                emit LandVerified(landIds[i]);
            }
            unchecked {
                ++i;
            }
        }
    }

    function putLandForSale(uint256 _landId) external validLandOwner(_landId) {
        require(!lands[_landId].isForSale, "Land already for sale");
        lands[_landId].isForSale = true;
        emit LandUpdated(_landId, LandUpdateType.SALE, "", 1);
    }

    // Update the removeLand function to include better error handling
    function removeLand(uint256 _landId) external validLandId(_landId) {
        // Verify ownership and state
        require(lands[_landId].owner == msg.sender, "Not the land owner");
        require(!lands[_landId].isForSale, "Land is currently for sale");

        // Get land owner's array
        uint256[] storage ownerLands = userLands[msg.sender];
        uint256 indexToRemove = landToArrayIndex[_landId];

        // Verify array bounds
        require(indexToRemove < ownerLands.length, "Land not found");

        // Clean up all references
        _cleanupLand(_landId);

        emit LandRemoved(_landId);
    }

    function takeLandOffSale(uint256 _landId) external validLandOwner(_landId) {
        require(lands[_landId].isForSale, "Land not for sale");
        lands[_landId].isForSale = false;
        emit LandUpdated(_landId, LandUpdateType.STATUS, "", 0);
    }

    function updateLandPrice(
        uint256 _landId,
        uint256 _newPrice
    )
        external
        validLandId(_landId)
        validLandOwner(_landId)
        validPrice(_newPrice)
    {
        lands[_landId].price = _newPrice;
        _recordLandHistory(
            _landId,
            msg.sender,
            msg.sender,
            _newPrice,
            lands[_landId].documentHash,
            "Land price updated"
        );
        emit LandUpdated(_landId, LandUpdateType.PRICE, "", _newPrice);
    }

    function addLandDocument(
        uint256 _landId,
        bytes32 _documentHash,
        string memory _description
    ) external validLandId(_landId) validLandOwner(_landId) {
        require(_documentHash != bytes32(0), "Document hash required");
        require(bytes(_description).length > 0, "Description required");

        // Initialize metadata if it doesn't exist
        if (landMetadata[_landId].additionalDocuments.length == 0) {
            bytes32[] memory initialDocs = new bytes32[](1);
            string[] memory initialDescs = new string[](1);
            initialDocs[0] = _documentHash;
            initialDescs[0] = _description;

            landMetadata[_landId] = LandMetadata({
                additionalDocuments: initialDocs,
                documentDescriptions: initialDescs,
                lastUpdated: block.timestamp
            });
        } else {
            require(
                landMetadata[_landId].additionalDocuments.length <
                    MAX_DOCUMENTS_PER_LAND,
                "Maximum documents reached"
            );
            landMetadata[_landId].additionalDocuments.push(_documentHash);
            landMetadata[_landId].documentDescriptions.push(_description);
            landMetadata[_landId].lastUpdated = block.timestamp;
        }

        emit DocumentAdded(_landId, _documentHash);
    }

    // Internal function to record land history
    function _recordLandHistory(
        uint256 _landId,
        address _previousOwner,
        address _newOwner,
        uint256 _price,
        bytes32 _documentHash,
        string memory _description
    ) internal {
        require(
            landHistories[_landId].length < MAX_HISTORY_PER_LAND,
            "History limit reached"
        );
        landHistories[_landId].push(
            LandHistory({
                previousOwner: _previousOwner,
                newOwner: _newOwner,
                price: _price,
                timestamp: block.timestamp,
                documentHash: _documentHash,
                description: _description
            })
        );
    }

    // View Functions
    function getUserLands(
        address _user
    ) external view returns (uint256[] memory) {
        return userLands[_user];
    }

    function getLandDetails(
        uint256 _landId
    ) external view returns (Land memory) {
        require(_landId <= landIdCounter, "Invalid land ID");
        return lands[_landId];
    }

    function getLandHistory(
        uint256 _landId,
        uint256 offset,
        uint256 limit
    ) external view returns (LandHistory[] memory) {
        uint256 totalHistory = landHistories[_landId].length;
        require(offset < totalHistory, "Invalid offset");
        uint256 size = (offset + limit > totalHistory)
            ? totalHistory - offset
            : limit;
        LandHistory[] memory history = new LandHistory[](size);
        for (uint256 i = 0; i < size; i++) {
            history[i] = landHistories[_landId][offset + i];
        }
        return history;
    }

    // Add new function to get land metadata
    function getLandMetadata(
        uint256 _landId
    )
        external
        view
        returns (
            bytes32[] memory documents,
            string[] memory descriptions,
            uint256 lastUpdated
        )
    {
        LandMetadata storage metadata = landMetadata[_landId];
        return (
            metadata.additionalDocuments,
            metadata.documentDescriptions,
            metadata.lastUpdated
        );
    }

    // Add this function to get pending land verifications
    function getPendingVerifications() public view returns (uint256[] memory) {
        uint256 count = 0;
        // First pass: count valid pending lands
        for (uint256 i = 1; i <= landIdCounter; i++) {
            // Consider a land pending if:
            // 1. It exists (id != 0)
            // 2. It's not verified
            // 3. Has valid owner
            // 4. Has empty verificationRemark (not rejected)
            if (
                lands[i].id != 0 &&
                !lands[i].isVerified &&
                lands[i].owner != address(0) &&
                bytes(lands[i].verificationRemark).length == 0
            ) {
                count++;
            }
        }

        // Create array of exact size
        uint256[] memory pendingLands = new uint256[](count);
        uint256 index = 0;
        // Second pass: populate array
        for (uint256 i = 1; i <= landIdCounter; i++) {
            if (
                lands[i].id != 0 &&
                !lands[i].isVerified &&
                lands[i].owner != address(0) &&
                bytes(lands[i].verificationRemark).length == 0
            ) {
                pendingLands[index] = i;
                index++;
            }
        }
        return pendingLands;
    }

    // Move interface functions directly into contract
    function isLandForSale(uint256 landId) public view returns (bool) {
        return lands[landId].isForSale;
    }

    function getLandOwner(
        uint256 landId
    ) public view returns (address payable) {
        return lands[landId].owner;
    }

    function getLandPrice(uint256 landId) public view returns (uint256) {
        return lands[landId].price;
    }

    function isLandVerified(uint256 landId) public view returns (bool) {
        return lands[landId].isVerified;
    }

    function getLandCount() public view returns (uint256) {
        return landIdCounter;
    }

    function userRegistry() public view returns (address) {
        return address(_userRegistryInstance);
    }

    /**
     * @notice Transfers land ownership with required validations and history tracking
     * @param _landId Land identifier
     * @param _newOwner Address of new owner
     * @param _newDocumentHash Updated document hash
     * @dev Only callable by authorized contracts
     */
    function transferLandOwnership(
        uint256 _landId,
        address _newOwner,
        bytes32 _newDocumentHash
    ) external {
        // 1. Only authorized contracts can call this
        require(
            msg.sender == address(this) || authorizedContracts[msg.sender],
            "Caller not authorized"
        );
        // 2. Validate parameters
        require(_newOwner != address(0), "Invalid new owner");
        Land storage land = lands[_landId];
        address payable previousOwner = land.owner;
        require(previousOwner != _newOwner, "Same owner");

        // 3. Update ownership arrays
        _updateLandOwnership(_landId, previousOwner, _newOwner);

        // 4. Update land details
        land.owner = payable(_newOwner);
        land.documentHash = _newDocumentHash;
        land.isForSale = false;

        // 5. Record transfer history
        _recordLandHistory(
            _landId,
            previousOwner,
            _newOwner,
            land.price,
            _newDocumentHash,
            "Ownership transferred"
        );

        // 6. Emit event
        emit LandUpdated(
            _landId,
            LandUpdateType.STATUS,
            "Ownership transferred",
            0
        );
    }

    // Fix the authorizeTransactionRegistry function
    function authorizeTransactionRegistry(
        address _transactionRegistry
    ) external onlyOwner {
        require(_transactionRegistry != address(0), "Invalid address");
        // Single authorization for TransactionRegistry
        authorizedContracts[_transactionRegistry] = true;
        emit ContractAuthorized(_transactionRegistry);
    }

    // Add a view function to check if contract is authorized
    function isContractAuthorized(
        address _contract
    ) external view returns (bool) {
        return authorizedContracts[_contract];
    }

    // Add this public function to get landIdCounter
    function getTotalLands() external view returns (uint256) {
        return landIdCounter;
    }

    // Update getLandsByPage to use base contract pagination
    function getLandsByPage(
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (Land[] memory result, uint256 totalPages, uint256 totalItems)
    {
        totalItems = landIdCounter;
        if (totalItems == 0) return (new Land[](0), 0, 0);
        (uint256 startIndex, uint256 resultSize) = _validatePagination(
            page,
            pageSize,
            totalItems
        );
        totalPages = (totalItems + pageSize - 1) / pageSize;
        result = new Land[](resultSize);
        uint256 resultIndex = 0;
        for (uint256 i = startIndex + 1; i <= startIndex + resultSize; i++) {
            if (lands[i].id != 0) {
                result[resultIndex++] = lands[i];
            }
        }
        return (result, totalPages, totalItems);
    }

    // Add function to get filtered lands
    function getLandsForSale(
        uint256 minPrice,
        uint256 maxPrice,
        string memory location
    ) external view returns (Land[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= landIdCounter; i++) {
            if (
                lands[i].isForSale &&
                lands[i].price >= minPrice &&
                lands[i].price <= maxPrice &&
                (bytes(location).length == 0 ||
                    keccak256(bytes(lands[i].location)) ==
                    keccak256(bytes(location)))
            ) {
                count++;
            }
        }

        Land[] memory result = new Land[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= landIdCounter; i++) {
            if (
                lands[i].isForSale &&
                lands[i].price >= minPrice &&
                lands[i].price <= maxPrice &&
                (bytes(location).length == 0 ||
                    keccak256(bytes(lands[i].location)) ==
                    keccak256(bytes(location)))
            ) {
                result[index] = lands[i];
                index++;
            }
        }
        return result;
    }

    // Update the cleanup function to use the correct base function name
    function _cleanupLand(uint256 landId) internal {
        Land storage land = lands[landId];
        address owner = land.owner;
        // Update to use the correct cleanup function
        _cleanupUintArray(userLands[owner], landToArrayIndex, landId);
        // Clean up mappings
        delete lands[landId];
        delete landMetadata[landId];
        delete landHistories[landId];
        delete usedPIDs[land.propertyPID];
        // Clean up survey number
        if (bytes(land.surveyNumber).length > 0) {
            delete usedSurveyNumbers[land.surveyNumber];
        }
    }

    function _updateLandOwnership(
        uint256 _landId,
        address _previousOwner,
        address _newOwner
    ) internal {
        require(_newOwner != address(0), "Invalid new owner"); // Add validation
        require(_previousOwner != _newOwner, "Same owner"); // Add validation
        // Remove land from previous owner's array
        uint256[] storage prevOwnerLands = userLands[_previousOwner];
        uint256 indexToRemove = landToArrayIndex[_landId];
        if (indexToRemove < prevOwnerLands.length) {
            if (indexToRemove != prevOwnerLands.length - 1) {
                uint256 lastLandId = prevOwnerLands[prevOwnerLands.length - 1];
                prevOwnerLands[indexToRemove] = lastLandId;
                landToArrayIndex[lastLandId] = indexToRemove;
            }
            prevOwnerLands.pop();
        }
        // Add land to new owner's array
        userLands[_newOwner].push(_landId);
        landToArrayIndex[_landId] = userLands[_newOwner].length - 1;
    }

    // Add helper function to check availability (optional)
    function isLandIdentifierAvailable(
        uint256 propertyPID,
        string memory surveyNumber
    ) public view returns (bool pidAvailable, bool surveyAvailable) {
        return (!usedPIDs[propertyPID], !usedSurveyNumbers[surveyNumber]);
    }

    // Add getter function
    function getLandVerificationRemark(
        uint256 _landId
    ) external view returns (string memory) {
        return lands[_landId].verificationRemark;
    }
} // End of contract
