// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseRegistry.sol";
import "./LandRegistry.sol";
import "./UserRegistry.sol"; // Add this import

contract DisputeRegistry is BaseRegistry {
    enum DisputeCategory {
        OWNERSHIP,
        BOUNDARY,
        DOCUMENTATION,
        OTHER
    }

    // Dispute Management
    uint256 private disputeIdCounter;
    mapping(uint256 => Dispute[]) public landDisputes;
    uint256 public constant MAX_DISPUTES_PER_LAND = 50;

    LandRegistry public landRegistry;
    UserRegistry public userRegistry; // Add this state variable

    constructor(address _landRegistry) {
        landRegistry = LandRegistry(_landRegistry);
        userRegistry = UserRegistry(landRegistry.userRegistry());
    }

    // Events
    event DisputeRaised(
        uint256 indexed landId,
        uint256 indexed disputeId,
        address complainant
    );
    event DisputeResolved(
        uint256 indexed landId,
        uint256 indexed disputeId,
        string resolution
    );
    // Add events for better tracking
    event DisputeValidationFailed(uint256 landId, string reason);
    event DisputeResolutionFailed(uint256 disputeId, string reason);

    struct Dispute {
        uint256 disputeId;
        address complainant;
        string reason;
        bool resolved;
        string resolution;
        uint256 timestamp;
        DisputeCategory category;
    }

    // Function to raise a dispute
    function raiseDispute(
        uint256 _landId,
        string memory _reason,
        DisputeCategory _category
    ) external {
        UserRegistry.VerificationDetails
            memory verificationDetails = userRegistry.getVerificationStatus(
                msg.sender
            );
        require(
            verificationDetails.isRegistered && verificationDetails.isVerified,
            "User not verified"
        );
        require(
            userRegistry.hasRole(userRegistry.VERIFIED_USER_ROLE(), msg.sender),
            "User not authorized"
        );

        require(
            uint8(_category) <= uint8(DisputeCategory.OTHER),
            "Invalid category"
        );
        require(_landId <= landRegistry.getTotalLands(), "Invalid land ID");
        require(
            landRegistry.getLandDetails(_landId).id != 0,
            "Land does not exist"
        );
        require(bytes(_reason).length > 0, "Reason required");
        require(
            landDisputes[_landId].length < MAX_DISPUTES_PER_LAND,
            "Maximum disputes reached"
        );

        disputeIdCounter++;
        landDisputes[_landId].push(
            Dispute({
                disputeId: disputeIdCounter,
                complainant: msg.sender,
                reason: _reason,
                resolved: false,
                resolution: "",
                timestamp: block.timestamp,
                category: _category // Use the provided category
            })
        );

        emit DisputeRaised(_landId, disputeIdCounter, msg.sender);
    }

    function validateDispute(
        uint256 _landId,
        string memory _reason,
        DisputeCategory _category
    ) public view returns (bool) {
        UserRegistry.VerificationDetails
            memory verificationDetails = userRegistry.getVerificationStatus(
                msg.sender
            );
        require(
            verificationDetails.isRegistered && verificationDetails.isVerified,
            "User not verified"
        );
        require(
            userRegistry.hasRole(userRegistry.VERIFIED_USER_ROLE(), msg.sender),
            "User not authorized"
        );

        require(_landId <= landRegistry.getTotalLands(), "Invalid land ID");
        require(bytes(_reason).length > 0, "Reason required");
        require(
            uint8(_category) <= uint8(DisputeCategory.OTHER),
            "Invalid category"
        );

        return true;
    }

    // Function for inspector to resolve dispute
    function resolveDispute(
        uint256 _landId,
        uint256 _disputeId,
        string memory _resolution
    ) public onlyRole(INSPECTOR_ROLE) {
        // ...existing code...
        require(bytes(_resolution).length > 0, "Resolution required");

        Dispute[] storage disputes = landDisputes[_landId];
        bool found = false;

        for (uint256 i = 0; i < disputes.length; i++) {
            if (disputes[i].disputeId == _disputeId && !disputes[i].resolved) {
                disputes[i].resolved = true;
                disputes[i].resolution = _resolution;
                found = true;
                break;
            }
        }

        require(found, "Dispute not found or already resolved");
        emit DisputeResolved(_landId, _disputeId, _resolution);
    }

    function batchResolveDisputes(
        uint256[] calldata landIds,
        uint256[] calldata disputeIds,
        string[] calldata resolutions
    ) external onlyRole(INSPECTOR_ROLE) {
        require(
            landIds.length == disputeIds.length &&
                disputeIds.length == resolutions.length,
            "Array lengths mismatch"
        );
        for (uint i = 0; i < landIds.length; ) {
            resolveDispute(landIds[i], disputeIds[i], resolutions[i]);
            unchecked {
                ++i;
            }
        }
    }

    // View function to get land disputes
    function getLandDisputes(
        uint256 _landId,
        uint256 offset,
        uint256 limit
    ) external view returns (Dispute[] memory) {
        Dispute[] storage disputes = landDisputes[_landId];
        uint256 totalDisputes = disputes.length;
        require(offset < totalDisputes, "Invalid offset");

        uint256 size = (offset + limit > totalDisputes)
            ? totalDisputes - offset
            : limit;

        Dispute[] memory result = new Dispute[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = disputes[offset + i];
        }
        return result;
    }

    // Add this function to get open disputes
    function getOpenDisputes() public view returns (uint256) {
        uint256 openDisputesCount = 0;
        for (uint256 i = 1; i <= landRegistry.getTotalLands(); i++) {
            Dispute[] storage disputes = landDisputes[i];
            for (uint256 j = 0; j < disputes.length; j++) {
                if (!disputes[j].resolved) {
                    openDisputesCount++;
                }
            }
        }
        return openDisputesCount;
    }

    // Add helper function for frontend to get dispute statistics
    function getDisputeStats()
        external
        view
        returns (
            uint256 totalDisputes,
            uint256 openDisputes,
            uint256 resolvedDisputes,
            uint256[] memory disputesByCategory
        )
    {
        disputesByCategory = new uint256[](uint256(DisputeCategory.OTHER) + 1);

        for (uint256 i = 1; i <= landRegistry.getTotalLands(); i++) {
            Dispute[] storage disputes = landDisputes[i];
            for (uint256 j = 0; j < disputes.length; j++) {
                totalDisputes++;
                if (disputes[j].resolved) {
                    resolvedDisputes++;
                } else {
                    openDisputes++;
                }
                disputesByCategory[uint256(disputes[j].category)]++;
            }
        }

        return (
            totalDisputes,
            openDisputes,
            resolvedDisputes,
            disputesByCategory
        );
    }

    // Add safe pagination for disputes
    function getLandDisputesPaginated(
        uint256 _landId,
        uint256 page,
        uint256 pageSize,
        bool activeOnly
    )
        external
        view
        returns (
            Dispute[] memory result,
            uint256 totalPages,
            uint256 totalItems
        )
    {
        Dispute[] storage allDisputes = landDisputes[_landId];

        // Count valid disputes
        totalItems = 0;
        for (uint256 i = 0; i < allDisputes.length; i++) {
            if (!activeOnly || !allDisputes[i].resolved) {
                totalItems++;
            }
        }

        if (totalItems == 0) return (new Dispute[](0), 0, 0);

        (uint256 startIndex, uint256 resultSize) = _validatePagination(
            page,
            pageSize,
            totalItems
        );

        totalPages = (totalItems + pageSize - 1) / pageSize;
        result = new Dispute[](resultSize);
        uint256 resultIndex = 0;
        uint256 currentIndex = 0;

        for (
            uint256 i = 0;
            currentIndex < startIndex + resultSize && i < allDisputes.length;
            i++
        ) {
            if (!activeOnly || !allDisputes[i].resolved) {
                if (currentIndex >= startIndex) {
                    result[resultIndex++] = allDisputes[i];
                }
                currentIndex++;
            }
        }

        return (result, totalPages, totalItems);
    }

    // Add dispute cleanup function
    function _cleanupDisputes(uint256 landId) internal {
        delete landDisputes[landId];
    }
}
