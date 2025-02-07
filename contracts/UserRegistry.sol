// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseRegistry.sol";
import "./StringUtils.sol";

interface IVerificationDetails {
    struct VerificationDetails {
        bool isRegistered;
        bool isVerified;
        uint256 verificationTimestamp;
        address verifiedBy;
        string remarks;
    }
}

contract UserRegistry is BaseRegistry, IVerificationDetails {
    using StringUtils for string;

    mapping(address => User) public users;
    mapping(address => bool) public deactivatedUsers;
    mapping(address => VerificationDetails) private verificationDetails;
    mapping(string => address[]) private usersByCity;
    mapping(address => mapping(string => uint256)) private userCityIndex;
    mapping(address => string) private currentUserCity;
    mapping(address => bool) private _rejectedUsersMap; // Changed from rejectedUsers
    mapping(address => uint256) private rejectionTimestamps; // Add new mapping for rejection timestamps
    uint256 private constant REJECTION_COOLDOWN = 24 hours; // Add constant for rejection cooldown

    uint256 public constant MAX_USERS_PER_CITY = 1000;

    address[] public allUsers;
    mapping(address => uint256) private userIndex;

    // Add new mappings for unique document tracking
    mapping(string => bool) private usedAadharNumbers;
    mapping(string => bool) private usedPanNumbers;

    event UserRegistered(address indexed user, string name);
    event UserVerified(address indexed user);
    event UserUpdated(address indexed user, string name);
    event UserStatusChanged(address indexed user, bool isActive);
    event UserDocumentsUpdated(address indexed user);
    event UserRejected(
        address indexed user,
        string reason,
        uint256 rejectionTimestamp,
        uint256 cooldownEnds
    );
    event VerificationDetailsUpdated(
        address indexed user,
        string reason,
        uint256 timestamp
    );

    // Add new event and struct
    event RejectionDebug(
        address indexed user,
        string reason,
        bool hasRole,
        bool isRegistered,
        uint256 reasonLength
    );

    struct RejectionValidation {
        bool hasRole;
        bool isRegistered;
        bool alreadyRejected;
        uint256 reasonLength;
    }

    struct User {
        address id;
        string name;
        uint256 age;
        string city;
        string aadharNumber; // Changed from bytes32
        string panNumber; // Changed from bytes32
        bytes32 documentHash;
        string email;
        bool isVerified;
    }

    // Add new error types
    error InvalidAadharNumber(string message);
    error InvalidPanNumber(string message);
    error InvalidDocumentHash();
    error CityLimitReached(string city);
    error UserNotFound();
    error DuplicateAadhar(string aadhar);
    error DuplicatePan(string pan);

    // Add custom errors at the top of the contract
    error InvalidAadharFormat(string aadhar);
    error InvalidPanFormat(string pan);
    error UserAlreadyExists();
    error RejectionCooldownActive();

    modifier activeUser() {
        require(!deactivatedUsers[msg.sender], "User is deactivated");
        _;
    }

    modifier validAge(uint256 age) {
        require(age >= 18, "Must be an adult");
        _;
    }

    modifier validateString(string memory str, uint256 maxLength) {
        require(bytes(str).length > 0, "Empty string not allowed");
        require(bytes(str).length <= maxLength, "String too long");
        _;
    }

    function registerUser(
        string memory _name,
        uint256 _age,
        string memory _city,
        string memory _aadharNumber,
        string memory _panNumber,
        bytes32 _documentHash,
        string memory _email
    ) external {
        // 1. Check if user already exists
        require(
            !verificationDetails[msg.sender].isRegistered,
            "User already registered"
        );
        require(users[msg.sender].id == address(0), "User already exists");

        // 2. Input validation with detailed errors
        require(
            bytes(_name).length > 0 && bytes(_name).length <= 1000,
            "Invalid name length"
        );
        require(_age >= 18 && _age <= 120, "Invalid age");
        require(
            bytes(_city).length > 0 && bytes(_city).length <= 1000,
            "Invalid city length"
        );
        require(_documentHash != bytes32(0), "Invalid document hash");
        require(
            bytes(_email).length > 0 && bytes(_email).length <= 1000,
            "Invalid email length"
        );

        // 3. Strict Aadhar validation
        if (!StringUtils.isValidAadharNumber(_aadharNumber)) {
            revert InvalidAadharFormat(_aadharNumber);
        }

        // 4. Strict PAN validation
        if (!StringUtils.isValidPanNumber(_panNumber)) {
            revert InvalidPanFormat(_panNumber);
        }

        // 5. Check duplicate documents
        if (usedAadharNumbers[_aadharNumber]) {
            revert DuplicateAadhar(_aadharNumber);
        }
        if (usedPanNumbers[_panNumber]) {
            revert DuplicatePan(_panNumber);
        }

        // 2. Check rejection status
        if (_rejectedUsersMap[msg.sender]) {
            require(
                block.timestamp >=
                    rejectionTimestamps[msg.sender] + REJECTION_COOLDOWN,
                "Must wait 24 hours after rejection"
            );
            // Clean up rejection status
            delete _rejectedUsersMap[msg.sender];
            delete rejectionTimestamps[msg.sender];
            delete verificationDetails[msg.sender].remarks;
        }

        // Single existence check
        require(
            !verificationDetails[msg.sender].isRegistered &&
                users[msg.sender].id == address(0),
            "User already exists or is registered"
        );

        if (!StringUtils.isValidAadharNumber(_aadharNumber))
            revert InvalidAadharNumber("Invalid Aadhar format");
        if (!StringUtils.isValidPanNumber(_panNumber))
            revert InvalidPanNumber("Invalid PAN format");
        if (_documentHash == bytes32(0)) revert InvalidDocumentHash();
        if (!StringUtils.isValidEmail(_email)) revert("Invalid email format");
        if (usersByCity[_city].length >= MAX_USERS_PER_CITY)
            revert CityLimitReached(_city);

        // Add unique document checks
        if (usedAadharNumbers[_aadharNumber])
            revert DuplicateAadhar(_aadharNumber);
        if (usedPanNumbers[_panNumber]) revert DuplicatePan(_panNumber);

        // Mark documents as used
        usedAadharNumbers[_aadharNumber] = true;
        usedPanNumbers[_panNumber] = true;

        // 3. Create user
        users[msg.sender] = User({
            id: msg.sender,
            name: _name,
            age: _age,
            city: _city,
            aadharNumber: _aadharNumber,
            panNumber: _panNumber,
            documentHash: _documentHash,
            email: _email,
            isVerified: false
        });

        // 4. Update mappings and emit events
        allUsers.push(msg.sender);
        userIndex[msg.sender] = allUsers.length - 1;
        emit UserRegistered(msg.sender, _name);

        usersByCity[_city].push(msg.sender);
        userCityIndex[msg.sender][_city] = usersByCity[_city].length - 1;
        currentUserCity[msg.sender] = _city;

        // 5. Initialize verification details
        verificationDetails[msg.sender] = VerificationDetails({
            isRegistered: true,
            isVerified: false,
            verificationTimestamp: 0,
            verifiedBy: address(0),
            remarks: ""
        });

        // 6. Assign basic user role
        _assignRole(USER_ROLE, msg.sender);
    }

    // Add helper function for city cleanup
    function _removeFromCity(address user, string memory city) internal {
        uint256 index = userCityIndex[user][city];
        address[] storage cityUsers = usersByCity[city];

        if (cityUsers.length > 0) {
            if (index < cityUsers.length - 1) {
                address lastUser = cityUsers[cityUsers.length - 1];
                cityUsers[index] = lastUser;
                userCityIndex[lastUser][city] = index;
            }
            cityUsers.pop();
            delete userCityIndex[user][city];
        }
        delete currentUserCity[user];
    }

    function verifyUser(address _user) public onlyRole(INSPECTOR_ROLE) {
        require(_user != address(0), "Invalid address");
        require(verificationDetails[_user].isRegistered, "User not registered");

        if (!users[_user].isVerified) {
            users[_user].isVerified = true;
            verificationDetails[_user].isVerified = true;
            verificationDetails[_user].verificationTimestamp = block.timestamp;
            verificationDetails[_user].verifiedBy = msg.sender;
            verificationDetails[_user].remarks = ""; // Set default empty string

            _assignRole(USER_ROLE, _user);
            _assignRole(VERIFIED_USER_ROLE, _user);

            emit UserVerified(_user);
        }
    }

    function rejectUser(
        address user,
        string memory reason
    ) external onlyRole(INSPECTOR_ROLE) {
        // Input validation
        require(user != address(0), "Invalid user address");
        require(
            bytes(reason).length > 0 && bytes(reason).length <= 1000,
            "Invalid reason length"
        );
        require(verificationDetails[user].isRegistered, "User not registered");
        require(!_rejectedUsersMap[user], "User already rejected");

        // Log pre-rejection state
        emit RejectionDebug(
            user,
            reason,
            hasRole(INSPECTOR_ROLE, msg.sender),
            verificationDetails[user].isRegistered,
            bytes(reason).length
        );

        // Store rejection info
        uint256 rejectTime = block.timestamp;
        _rejectedUsersMap[user] = true;
        rejectionTimestamps[user] = rejectTime;

        // Update verification details atomically
        VerificationDetails storage details = verificationDetails[user];
        emit VerificationDetailsUpdated(user, reason, rejectTime); // Pre-storage event

        details.remarks = reason;
        details.isRegistered = false;
        details.isVerified = false;
        details.verificationTimestamp = rejectTime;

        emit VerificationDetailsUpdated(user, details.remarks, rejectTime); // Post-storage event

        // Clean up roles
        _revokeRole(USER_ROLE, user);
        _revokeRole(VERIFIED_USER_ROLE, user);

        // Emit final event
        emit UserRejected(
            user,
            reason,
            rejectTime,
            rejectTime + REJECTION_COOLDOWN
        );
    }

    // Add debug function
    function debugRejection(
        address user,
        string memory reason
    ) external view returns (RejectionValidation memory) {
        return
            RejectionValidation({
                hasRole: hasRole(INSPECTOR_ROLE, msg.sender),
                isRegistered: verificationDetails[user].isRegistered,
                alreadyRejected: _rejectedUsersMap[user],
                reasonLength: bytes(reason).length
            });
    }

    function batchVerifyUsers(
        address[] calldata _userAddresses
    ) external onlyRole(INSPECTOR_ROLE) {
        for (uint i = 0; i < _userAddresses.length; ) {
            if (!users[_userAddresses[i]].isVerified) {
                verifyUser(_userAddresses[i]);
            }
            unchecked {
                ++i;
            }
        }
    }

    function updateUserDetails(
        string calldata _name,
        uint256 _age,
        string calldata _city,
        string calldata _email
    )
        external
        activeUser
        validAge(_age)
        validateString(_name, 1000)
        validateString(_city, 1000)
        validateString(_email, 1000)
    {
        User storage user = users[msg.sender];
        require(user.id != address(0), "User not registered");
        require(StringUtils.isValidEmail(_email), "Invalid email format");

        _handleCityUpdate(_city);
        _updateBasicDetails(_name, _age, _city, _email);
    }

    function _handleCityUpdate(string memory _newCity) internal {
        string memory oldCity = currentUserCity[msg.sender];
        bytes32 newCityHash = keccak256(bytes(_newCity));
        bytes32 oldCityHash = keccak256(bytes(oldCity));

        if (oldCityHash != newCityHash) {
            _updateUserCity(oldCity, _newCity);
        }
    }

    function _updateBasicDetails(
        string memory _name,
        uint256 _age,
        string memory _city,
        string memory _email
    ) internal {
        User storage user = users[msg.sender];
        user.name = _name;
        user.age = _age;
        user.city = _city;
        user.email = _email;

        emit UserUpdated(msg.sender, _name);
    }

    function _updateUserCity(
        string memory oldCity,
        string memory newCity
    ) internal {
        uint256 oldIndex = userCityIndex[msg.sender][oldCity];
        address[] storage oldCityUsers = usersByCity[oldCity];

        if (oldCityUsers.length > 1) {
            address lastUser = oldCityUsers[oldCityUsers.length - 1];
            oldCityUsers[oldIndex] = lastUser;
            userCityIndex[lastUser][oldCity] = oldIndex;
        }
        oldCityUsers.pop();

        usersByCity[newCity].push(msg.sender);
        userCityIndex[msg.sender][newCity] = usersByCity[newCity].length - 1;
        currentUserCity[msg.sender] = newCity;
    }

    function deactivateUser() external {
        require(roles[USER_ROLE][msg.sender], "User not registered");
        require(!deactivatedUsers[msg.sender], "User already deactivated");
        deactivatedUsers[msg.sender] = true;
        emit UserStatusChanged(msg.sender, false);
    }

    function reactivateUser() external {
        require(roles[USER_ROLE][msg.sender], "User not registered");
        require(deactivatedUsers[msg.sender], "User not deactivated");
        deactivatedUsers[msg.sender] = false;
        emit UserStatusChanged(msg.sender, true);
    }

    function updateUserDocuments(
        string memory _aadharNumber,
        string memory _panNumber
    ) external activeUser onlyRole(USER_ROLE) {
        if (!StringUtils.isValidAadharNumber(_aadharNumber))
            revert InvalidAadharNumber("Invalid Aadhar format");
        if (!StringUtils.isValidPanNumber(_panNumber))
            revert InvalidPanNumber("Invalid PAN format");

        User storage user = users[msg.sender];
        if (user.id == address(0)) revert UserNotFound();

        // Remove old document mappings
        if (bytes(user.aadharNumber).length > 0) {
            usedAadharNumbers[user.aadharNumber] = false;
        }
        if (bytes(user.panNumber).length > 0) {
            usedPanNumbers[user.panNumber] = false;
        }

        // Check if new documents are already in use
        if (usedAadharNumbers[_aadharNumber])
            revert DuplicateAadhar(_aadharNumber);
        if (usedPanNumbers[_panNumber]) revert DuplicatePan(_panNumber);

        // Mark new documents as used
        usedAadharNumbers[_aadharNumber] = true;
        usedPanNumbers[_panNumber] = true;

        user.aadharNumber = _aadharNumber;
        user.panNumber = _panNumber;

        emit UserDocumentsUpdated(msg.sender);
    }

    function getUsersByCity(
        string memory _city,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        address[] storage cityUsers = usersByCity[_city];
        uint256 totalUsers = cityUsers.length;
        require(offset < totalUsers, "Invalid offset");

        uint256 size = (offset + limit > totalUsers)
            ? totalUsers - offset
            : limit;

        address[] memory userAddresses = new address[](size);
        for (uint256 i = 0; i < size; i++) {
            userAddresses[i] = cityUsers[offset + i];
        }
        return userAddresses;
    }

    function getVerificationStatus(
        address _user
    ) external view returns (VerificationDetails memory) {
        require(_user != address(0), "Invalid address");
        return verificationDetails[_user];
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return checkRole(role, account);
    }

    function getPendingUsers() public view returns (User[] memory) {
        uint256 count = 0;
        uint256 total = allUsers.length;

        // First pass: count with consistent checks
        for (uint256 i = 0; i < total; ) {
            address userAddr = allUsers[i];
            if (isValidPendingUser(userAddr)) {
                count++;
            }
            unchecked {
                ++i;
            }
        }

        User[] memory pendingUsers = new User[](count);

        // Second pass: populate with same checks
        if (count > 0) {
            uint256 index = 0;
            for (uint256 i = 0; i < total; ) {
                address userAddr = allUsers[i];
                if (isValidPendingUser(userAddr)) {
                    pendingUsers[index] = users[userAddr];
                    unchecked {
                        ++index;
                    }
                }
                unchecked {
                    ++i;
                }
            }
        }
        return pendingUsers;
    }

    // Add helper function for consistent checks
    function isValidPendingUser(address userAddr) internal view returns (bool) {
        return
            verificationDetails[userAddr].isRegistered &&
            !verificationDetails[userAddr].isVerified &&
            !_rejectedUsersMap[userAddr] && // Updated reference
            bytes(users[userAddr].name).length > 0;
    }

    function getVerifiedUsers() public view returns (User[] memory) {
        uint256 count = 0;

        // First pass: count verified users
        for (uint256 i = 0; i < allUsers.length; ) {
            address userAddress = allUsers[i];
            if (verificationDetails[userAddress].isVerified) {
                count++;
            }
            unchecked {
                ++i;
            }
        }

        User[] memory verifiedUsers = new User[](count);

        // Second pass: populate array
        if (count > 0) {
            uint256 index = 0;
            for (uint256 i = 0; i < allUsers.length; ) {
                address userAddress = allUsers[i];
                if (verificationDetails[userAddress].isVerified) {
                    verifiedUsers[index] = users[userAddress];
                    index++;
                }
                unchecked {
                    ++i;
                }
            }
        }

        return verifiedUsers;
    }

    function isUserRegistered(address user) external view returns (bool) {
        return verificationDetails[user].isRegistered;
    }

    function getUserDocuments(
        address user
    ) external view returns (string memory, string memory, bytes32) {
        User storage userInfo = users[user];
        return (
            userInfo.aadharNumber,
            userInfo.panNumber,
            userInfo.documentHash
        );
    }

    function getAllUsers() public view returns (User[] memory) {
        User[] memory allUsersList = new User[](allUsers.length);
        for (uint256 i = 0; i < allUsers.length; i++) {
            allUsersList[i] = users[allUsers[i]];
        }
        return allUsersList;
    }

    function _cleanupUserData(address user) internal {
        // Get user document details before cleanup
        string memory aadhar = users[user].aadharNumber;
        string memory pan = users[user].panNumber;

        // Clean up document uniqueness mappings
        if (bytes(aadhar).length > 0) {
            usedAadharNumbers[aadhar] = false;
        }
        if (bytes(pan).length > 0) {
            usedPanNumbers[pan] = false;
        }

        // Clean up city data first
        if (bytes(currentUserCity[user]).length > 0) {
            _removeFromCity(user, currentUserCity[user]);
        }

        // Clean up from allUsers array
        if (userIndex[user] > 0) {
            uint256 index = userIndex[user];
            address lastUser = allUsers[allUsers.length - 1];
            allUsers[index] = lastUser;
            userIndex[lastUser] = index;
            allUsers.pop();
            delete userIndex[user];
        }

        // Clear all related mappings
        delete users[user];
        delete verificationDetails[user];
        delete deactivatedUsers[user];
    }

    // Add helper function to check document availability
    function isDocumentAvailable(
        string memory aadhar,
        string memory pan
    ) public view returns (bool aadharAvailable, bool panAvailable) {
        return (!usedAadharNumbers[aadhar], !usedPanNumbers[pan]);
    }

    // Add cleanup function for rejected status
    function clearRejectedStatus() external {
        require(_rejectedUsersMap[msg.sender], "No rejection status to clear"); // Updated reference
        delete _rejectedUsersMap[msg.sender]; // Updated reference
    }

    // Optional: Add function to check remaining cooldown time
    function getRejectionCooldown(
        address user
    ) external view returns (uint256) {
        if (!_rejectedUsersMap[user]) return 0; // Updated reference
        uint256 endTime = rejectionTimestamps[user] + REJECTION_COOLDOWN;
        if (block.timestamp >= endTime) return 0;
        return endTime - block.timestamp;
    }

    // Add public view functions for rejection status
    function isUserRejected(address user) public view returns (bool) {
        // Changed function name
        return _rejectedUsersMap[user];
    }

    function rejectionTimestamp(address user) public view returns (uint256) {
        return rejectionTimestamps[user];
    }
}
