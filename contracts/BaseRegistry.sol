// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BaseRegistry
 * @dev Base contract for role-based access control and emergency functions
 * @notice Provides core functionality for user roles and contract security
 */

contract BaseRegistry {
    // Core State Variables
    address public owner;
    bool public paused;
    bool private locked;
    string public constant VERSION = "1.0.0";

    // Role Definition Constants
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    bytes32 public constant VERIFIED_USER_ROLE =
        keccak256("VERIFIED_USER_ROLE");

    // Role and User Management
    mapping(bytes32 => mapping(address => bool)) internal roles;

    struct LandInspector {
        uint id;
        string name;
        uint age;
        string designation;
    }

    mapping(address => LandInspector) public inspectors;
    uint private inspectorCounter;

    // Events
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event RoleAssigned(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);
    event Paused(address account);
    event Unpaused(address account);
    event EmergencyWithdrawal(address owner, uint256 amount);
    event InspectorAdded(address indexed inspector, uint id);
    event InspectorRemoved(address indexed inspector, uint id);

    // Add common error codes
    error InvalidPagination(string message);
    error UnauthorizedAccess(string message);
    error ValidationError(string message);

    constructor() {
        owner = msg.sender;
        roles[ADMIN_ROLE][msg.sender] = true; // Directly set admin role
        emit RoleAssigned(ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(roles[role][msg.sender], "Caller does not have required role");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // Role Management Functions
    function assignRole(
        address user,
        bytes32 role
    ) external onlyRole(ADMIN_ROLE) {
        require(user != address(0), "Invalid address");
        // Remove the duplicate check since it's handled in _assignRole
        _assignRole(role, user);
    }

    function revokeRole(
        address user,
        bytes32 role
    ) external onlyRole(ADMIN_ROLE) {
        require(user != address(0), "Invalid address");
        require(roles[role][user], "Role not assigned");
        _revokeRole(role, user);
    }

    function checkRole(bytes32 role, address user) public view returns (bool) {
        return roles[role][user];
    }

    function _assignRole(bytes32 role, address user) internal {
        require(user != address(0), "Invalid address");

        // Simplified role hierarchy
        if (role == VERIFIED_USER_ROLE) {
            require(roles[USER_ROLE][user], "Must have basic role");
        }

        roles[role][user] = true;
        emit RoleAssigned(role, user);
    }

    function _revokeRole(bytes32 role, address user) internal {
        // Enforce role dependency
        if (role == USER_ROLE) {
            _revokeRole(VERIFIED_USER_ROLE, user); // Remove dependent role first
        }

        roles[role][user] = false;
        emit RoleRevoked(role, user);
    }

    // Ownership Management Functions
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Emergency Pause Mechanism
    function pause() external onlyRole(ADMIN_ROLE) {
        require(!paused, "Contract is already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        require(paused, "Contract is not paused");
        paused = false;
        emit Unpaused(msg.sender);
    }

    // Emergency fund recovery
    function emergencyWithdraw() external onlyOwner {
        require(paused, "Contract must be paused");
        uint256 amount = address(this).balance;
        payable(owner).transfer(amount);
        emit EmergencyWithdrawal(owner, amount);
    }

    function addInspector(
        address _inspector,
        string memory _name,
        uint _age,
        string memory _designation
    ) external onlyOwner {
        require(_inspector != address(0), "Invalid inspector address");
        require(_age >= 18, "Inspector must be an adult");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_designation).length > 0, "Designation cannot be empty");
        require(inspectors[_inspector].id == 0, "Inspector already exists");

        inspectorCounter++;
        inspectors[_inspector] = LandInspector(
            inspectorCounter,
            _name,
            _age,
            _designation
        );
        _assignRole(INSPECTOR_ROLE, _inspector);

        emit InspectorAdded(_inspector, inspectorCounter);
        emit RoleAssigned(INSPECTOR_ROLE, _inspector);
    }

    function removeInspector(address _inspector) external onlyOwner {
        require(_inspector != address(0), "Invalid inspector address");
        require(inspectors[_inspector].id != 0, "Inspector does not exist");

        uint inspectorId = inspectors[_inspector].id;
        delete inspectors[_inspector];
        _revokeRole(INSPECTOR_ROLE, _inspector);

        emit InspectorRemoved(_inspector, inspectorId);
        emit RoleRevoked(INSPECTOR_ROLE, _inspector);
    }

    function getInspector(
        address _inspector
    ) external view returns (LandInspector memory) {
        require(inspectors[_inspector].id != 0, "Inspector does not exist");
        return inspectors[_inspector];
    }

    // Add common validation utilities
    function _validatePagination(
        uint256 page,
        uint256 pageSize,
        uint256 totalItems
    ) internal pure returns (uint256 startIndex, uint256 resultSize) {
        if (pageSize == 0) revert InvalidPagination("Invalid page size");
        if (totalItems == 0) return (0, 0);

        uint256 totalPages = (totalItems + pageSize - 1) / pageSize;
        if (page >= totalPages) revert InvalidPagination("Page out of bounds");

        startIndex = page * pageSize;
        resultSize = startIndex + pageSize > totalItems
            ? totalItems - startIndex
            : pageSize;
        return (startIndex, resultSize);
    }

    // Add reusable validation functions
    function _validateString(
        string memory str,
        uint256 minLength,
        uint256 maxLength
    ) internal pure {
        uint256 length = bytes(str).length;
        if (length < minLength || length > maxLength) {
            revert ValidationError("Invalid string length");
        }
    }

    // Update the cleanup function to handle different types
    function _cleanupAddressArray(
        address[] storage array,
        mapping(address => uint256) storage indices,
        address target
    ) internal {
        uint256 index = indices[target];
        uint256 lastIndex = array.length - 1;

        if (index != lastIndex) {
            address lastItem = array[lastIndex];
            array[index] = lastItem;
            indices[lastItem] = index;
        }
        array.pop();
        delete indices[target];
    }

    function _cleanupUintArray(
        uint256[] storage array,
        mapping(uint256 => uint256) storage indices,
        uint256 target
    ) internal {
        uint256 index = indices[target];
        uint256 lastIndex = array.length - 1;

        if (index != lastIndex) {
            uint256 lastItem = array[lastIndex];
            array[index] = lastItem;
            indices[lastItem] = index;
        }
        array.pop();
        delete indices[target];
    }

    function _validateAddress(
        address addr,
        string memory message
    ) internal pure {
        require(addr != address(0), message);
    }
}
