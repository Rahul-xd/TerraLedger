// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseRegistry.sol";
import "./LandRegistry.sol";
import "./UserRegistry.sol";

contract TransactionRegistry is BaseRegistry {
    uint256 private requestIdCounter;
    mapping(uint256 => PurchaseRequest) public purchaseRequests;
    mapping(address => uint256[]) private userPurchaseRequests;
    mapping(address => Transaction[]) private transactions;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => uint256) private marketVolumes;
    mapping(TransactionType => uint256) private transactionCounts;

    LandRegistry public landRegistry;
    UserRegistry public userRegistry;

    event LandPurchaseRequested(uint256 indexed requestId, uint256 landId);
    event PurchaseRequestStatusChanged(
        uint256 indexed requestId,
        RequestStatus status
    );
    event PurchaseRequestCancelled(uint256 indexed requestId);
    event LandOwnershipTransferred(
        uint256 indexed landId,
        address indexed from,
        address indexed to
    );
    event TransactionRecorded(
        uint256 indexed transactionId,
        address indexed user
    );
    event MarketMetricsUpdated(uint256 averagePrice, uint256 totalVolume);
    event PurchaseRequestCreated(
        uint256 indexed requestId,
        uint256 indexed landId,
        address indexed creator
    );
    // Add events for debugging
    event RequestDebug(
        uint256 indexed requestId,
        address indexed user,
        string action,
        RequestStatus status
    );
    event StatsDebug(
        address indexed user,
        uint256 total,
        uint256 pending,
        uint256 incoming,
        uint256 outgoing
    );

    struct PurchaseRequest {
        uint256 requestId;
        address payable seller;
        address payable buyer;
        uint256 landId;
        RequestStatus status;
        bool isPaymentDone;
    }

    struct Transaction {
        uint256 id;
        uint256 landId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        TransactionType transactionType;
        LandRegistry.Land land; // Use LandRegistry's Land struct directly
    }

    enum RequestStatus {
        PENDING, // Initial state
        ACCEPTED, // After seller accepts
        REJECTED, // After seller rejects or buyer cancels
        PAYMENT_DONE, // After payment completion
        COMPLETED // Final state
    }

    enum TransactionType {
        PURCHASE,
        SALE,
        DOCUMENT_UPDATE,
        VERIFICATION
    }

    constructor(address _landRegistry) {
        require(_landRegistry != address(0), "Invalid LandRegistry address");
        landRegistry = LandRegistry(_landRegistry);
        userRegistry = UserRegistry(LandRegistry(_landRegistry).userRegistry());
        // Remove authorization check from constructor
    }

    // Add initialization check to critical functions
    modifier onlyAfterAuthorization() {
        require(
            landRegistry.isContractAuthorized(address(this)),
            "TransactionRegistry not authorized"
        );
        _;
    }

    function createPurchaseRequest(uint256 _landId) external {
        // Validates land status
        require(msg.sender != address(0), "Invalid sender address");

        require(
            userRegistry.isUserRegistered(msg.sender) &&
                userRegistry.hasRole(
                    userRegistry.VERIFIED_USER_ROLE(),
                    msg.sender
                ),
            "User not verified"
        );

        require(landRegistry.isLandVerified(_landId), "Land not verified");
        require(landRegistry.isLandForSale(_landId), "Land not for sale");

        address payable owner = landRegistry.getLandOwner(_landId);
        require(owner != msg.sender, "Cannot buy own land");
        require(owner != address(0), "Invalid land owner");

        // Creates request
        requestIdCounter++;
        PurchaseRequest memory newRequest = PurchaseRequest({
            requestId: requestIdCounter,
            seller: owner,
            buyer: payable(msg.sender),
            landId: _landId,
            status: RequestStatus.PENDING,
            isPaymentDone: false
        });

        purchaseRequests[requestIdCounter] = newRequest;

        // Updates mappings
        userPurchaseRequests[msg.sender].push(requestIdCounter);
        userPurchaseRequests[owner].push(requestIdCounter);

        // Create transaction records
        _createTransactionRecord(
            msg.sender,
            owner,
            _landId,
            TransactionType.PURCHASE
        );

        // Emits events
        emit LandPurchaseRequested(requestIdCounter, _landId);
        emit PurchaseRequestCreated(requestIdCounter, _landId, msg.sender);
        emit PurchaseRequestStatusChanged(
            requestIdCounter,
            RequestStatus.PENDING
        );
    }

    // Add new helper function
    function _createTransactionRecord(
        address buyer,
        address seller,
        uint256 landId,
        TransactionType txType
    ) internal {
        // Get land details once
        LandRegistry.Land memory land = landRegistry.getLandDetails(landId);

        // Create buyer's transaction record
        transactions[buyer].push(
            Transaction({
                id: transactions[buyer].length + 1,
                landId: landId,
                from: buyer,
                to: seller,
                amount: 0,
                timestamp: block.timestamp,
                transactionType: txType,
                land: land
            })
        );

        // Create seller's transaction record
        transactions[seller].push(
            Transaction({
                id: transactions[seller].length + 1,
                landId: landId,
                from: buyer,
                to: seller,
                amount: 0,
                timestamp: block.timestamp,
                transactionType: txType,
                land: land
            })
        );
    }

    function isRequestValid(uint256 _requestId) public view returns (bool) {
        PurchaseRequest storage request = purchaseRequests[_requestId];
        return
            request.requestId == _requestId &&
            request.buyer != address(0) &&
            request.seller != address(0);
    }

    // Update processPurchaseRequest with debug events
    function processPurchaseRequest(uint256 _requestId, bool _accept) public {
        // Add debug event at start
        emit RequestDebug(
            _requestId,
            msg.sender,
            "process_start",
            RequestStatus.PENDING
        );

        PurchaseRequest storage request = purchaseRequests[_requestId];
        require(request.status == RequestStatus.PENDING, "Request not pending");
        require(request.seller == msg.sender, "Not authorized");

        RequestStatus newStatus = _accept
            ? RequestStatus.ACCEPTED
            : RequestStatus.REJECTED;
        request.status = newStatus;

        // Add debug event for status change
        emit RequestDebug(
            _requestId,
            msg.sender,
            _accept ? "request_accepted" : "request_rejected",
            newStatus
        );
        emit PurchaseRequestStatusChanged(_requestId, newStatus);
    }

    function cancelPurchaseRequest(uint256 _requestId) external {
        PurchaseRequest storage request = purchaseRequests[_requestId];
        require(request.buyer == msg.sender, "Not the buyer");
        require(request.status == RequestStatus.PENDING, "Request not pending");

        request.status = RequestStatus.REJECTED;
        emit PurchaseRequestCancelled(_requestId);
    }

    // Remove logger.debug and use events instead
    // Update makePayment with additional checks
    function makePayment(uint256 _requestId) external payable nonReentrant {
        // Validate request state
        PurchaseRequest storage request = purchaseRequests[_requestId];
        require(request.buyer == msg.sender, "Not the buyer");
        require(
            request.status == RequestStatus.ACCEPTED,
            "Request not accepted"
        );
        require(!request.isPaymentDone, "Already paid");

        // Verify exact price match
        uint256 landPrice = landRegistry.getLandPrice(request.landId);
        require(msg.value == landPrice, "Incorrect payment amount");

        // Process payment
        request.isPaymentDone = true;
        request.status = RequestStatus.COMPLETED;
        pendingWithdrawals[request.seller] += msg.value;

        // Update market metrics with the payment amount
        _updateMarketMetrics(_requestId, msg.value); // Add this line

        // Transfer ownership
        landRegistry.transferLandOwnership(
            request.landId,
            request.buyer,
            landRegistry.getLandDetails(request.landId).documentHash
        );

        // Emit events
        emit PurchaseRequestStatusChanged(_requestId, RequestStatus.COMPLETED);
        emit LandOwnershipTransferred(
            request.landId,
            request.seller,
            request.buyer
        );
    }

    // Add helper function
    function _updateMarketMetrics(uint256 requestId, uint256 amount) internal {
        uint256 currentYear = block.timestamp / 365 days;
        marketVolumes[currentYear] += amount;
        emit MarketMetricsUpdated(
            _calculateAveragePrice(),
            marketVolumes[currentYear]
        );
    }

    // Add getter function to retrieve total volume for current year
    function getCurrentYearVolume() external view returns (uint256) {
        uint256 currentYear = block.timestamp / 365 days;
        return marketVolumes[currentYear];
    }

    function _calculateAveragePrice() internal view returns (uint256) {
        uint256 totalPrice = 0;
        uint256 count = 0;

        for (uint256 i = 1; i <= landRegistry.getLandCount(); i++) {
            if (landRegistry.isLandVerified(i)) {
                totalPrice += landRegistry.getLandPrice(i);
                count++;
            }
        }

        return count > 0 ? totalPrice / count : 0;
    }

    // Make this public
    function calculateAveragePrice() public view returns (uint256) {
        uint256 totalPrice = 0;
        uint256 count = 0;

        for (uint256 i = 1; i <= landRegistry.getLandCount(); i++) {
            if (landRegistry.isLandVerified(i)) {
                totalPrice += landRegistry.getLandPrice(i);
                count++;
            }
        }

        return count > 0 ? totalPrice / count : 0;
    }

    // Add this function
    function getTotalVolume(uint256 year) public view returns (uint256) {
        return marketVolumes[year];
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        // Clear balance before transfer
        pendingWithdrawals[msg.sender] = 0;

        // Transfer ETH
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getPurchaseRequest(
        uint256 _requestId
    ) external view returns (PurchaseRequest memory) {
        return purchaseRequests[_requestId];
    }

    function getTransactionCount() external view returns (uint256) {
        return requestIdCounter;
    }

    function _validateStatusTransition(
        RequestStatus current,
        RequestStatus next
    ) internal pure {
        require(uint(next) > uint(current), "Invalid status transition");
    }

    function batchProcessRequests(
        uint256[] calldata requestIds,
        bool[] calldata decisions
    ) external onlyRole(VERIFIED_USER_ROLE) {
        uint256 length = requestIds.length;
        require(length == decisions.length, "Array lengths mismatch");

        for (uint256 i = 0; i < length; ) {
            _processRequest(requestIds[i], decisions[i]);
            unchecked {
                ++i;
            }
        }
    }

    function _processRequest(uint256 requestId, bool decision) internal {
        PurchaseRequest storage request = purchaseRequests[requestId];
        if (request.status != RequestStatus.PENDING) return;

        RequestStatus newStatus = decision
            ? RequestStatus.ACCEPTED
            : RequestStatus.REJECTED;

        request.status = newStatus;
        emit PurchaseRequestStatusChanged(requestId, newStatus);
    }

    // Add helper functions for frontend pagination
    function getUserTransactionSummary(
        address _user
    )
        external
        view
        returns (
            uint256 total,
            uint256 pending,
            uint256 incoming,
            uint256 outgoing
        )
    {
        uint256[] memory requests = userPurchaseRequests[_user];

        for (uint256 i = 0; i < requests.length; i++) {
            PurchaseRequest storage request = purchaseRequests[requests[i]];
            // Only count non-completed requests
            if (request.status != RequestStatus.COMPLETED) {
                if (request.seller == _user) {
                    if (request.status == RequestStatus.PENDING) {
                        incoming++;
                    }
                    total++;
                }
                if (request.buyer == _user) {
                    if (request.status == RequestStatus.PENDING) {
                        outgoing++;
                    }
                    total++;
                }
                // Add pending count only for PENDING status
                if (request.status == RequestStatus.PENDING) {
                    pending++;
                }
            }
        }

        return (total, pending, incoming, outgoing);
    }

    // Add separate non-view function for debugging if needed
    function debugUserStats(address _user) external {
        (
            uint256 total,
            uint256 pending,
            uint256 incoming,
            uint256 outgoing
        ) = this.getUserTransactionSummary(_user);

        emit StatsDebug(_user, total, pending, incoming, outgoing);
    }

    // Add safe pagination for transaction history
    struct TransactionPageResult {
        Transaction[] transactions;
        uint256 totalPages;
        uint256 totalItems;
    }

    function getUserTransactionHistoryPage(
        address _user,
        uint256 page,
        uint256 pageSize
    ) external view returns (TransactionPageResult memory) {
        _validateAddress(_user, "Invalid user address");

        Transaction[] storage userTxs = transactions[_user];
        uint256 totalItems = userTxs.length;

        if (totalItems == 0) {
            return
                TransactionPageResult({
                    transactions: new Transaction[](0),
                    totalPages: 0,
                    totalItems: 0
                });
        }

        (uint256 startIndex, uint256 resultSize) = _validatePagination(
            page,
            pageSize,
            totalItems
        );

        uint256 totalPages = (totalItems + pageSize - 1) / pageSize;
        Transaction[] memory result = new Transaction[](resultSize);

        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = userTxs[startIndex + i];
            // Get land details directly from LandRegistry
            result[i].land = landRegistry.getLandDetails(result[i].landId);
        }

        return
            TransactionPageResult({
                transactions: result,
                totalPages: totalPages,
                totalItems: totalItems
            });
    }

    // Add cleanup function for transactions
    function _cleanupTransactions(address user) internal {
        delete transactions[user];
        delete userPurchaseRequests[user];
        delete pendingWithdrawals[user];
    }

    // Update the function to use RequestStatus instead
    function getLandRequests(
        uint256 _landId,
        RequestStatus _status
    ) external view returns (PurchaseRequest[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= requestIdCounter; i++) {
            if (
                purchaseRequests[i].landId == _landId &&
                purchaseRequests[i].status == _status
            ) {
                count++;
            }
        }

        PurchaseRequest[] memory result = new PurchaseRequest[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= requestIdCounter; i++) {
            if (
                purchaseRequests[i].landId == _landId &&
                purchaseRequests[i].status == _status
            ) {
                result[index] = purchaseRequests[i];
                index++;
            }
        }

        return result;
    }

    // Remove duplicate validation code from other functions
    // ...existing code...

    // Add this function
    function getUserPurchaseRequests(
        address user
    ) external view returns (PurchaseRequest[] memory) {
        require(user != address(0), "Invalid address");
        uint256[] memory userRequests = userPurchaseRequests[user];
        PurchaseRequest[] memory requests = new PurchaseRequest[](
            userRequests.length
        );

        uint256 validCount = 0; // Track actual number of valid requests
        for (uint256 i = 0; i < userRequests.length; i++) {
            PurchaseRequest memory request = purchaseRequests[userRequests[i]];
            // Only include if user is buyer or seller (filter valid ones)
            if (request.buyer == user || request.seller == user) {
                requests[validCount] = request; // Use validCount as index
                validCount++; // Increment only for valid requests
            }
        }

        // Trim array to actual size using assembly
        assembly {
            mstore(requests, validCount) // Set actual length
        }

        return requests;
    }

    // Helper function to convert uint to string
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint160(addr) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            buffer[2 * i] = char(hi);
            buffer[2 * i + 1] = char(lo);
        }
        return string(buffer);
    }

    function char(bytes1 b) internal pure returns (bytes1) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
