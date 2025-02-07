// Central place for:
// Contract addresses
// IPFS configuration
// Role definitions

import { ethers } from 'ethers';

export const CONTRACT_ADDRESSES = {
    userRegistryAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    landRegistryAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    transactionRegistryAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    disputeRegistryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
};

export const IPFS_CONFIG = {
    PINATA_GATEWAY: 'https://gateway.pinata.cloud/ipfs',
    apiKey: "9cb7f8e6a0052ee5429a",
    secretKey: "36f960d400785adb2f768e5c2f01128e29c56c85977d8b4e322f3994f230c2ff",
    baseURL: "https://api.pinata.cloud/pinning/pinFileToIPFS"
};

export const CHAIN_CONFIG = {
    hardhatChainId: '0x7a69', // Lowercase chainId
    supportedChainIds: ['0x7a69'],
    networkNames: {
        '0x7a69': 'Hardhat'
    }
};

export const ROLES = {
    ADMIN_ROLE: 'ADMIN',
    INSPECTOR_ROLE: 'INSPECTOR',
    VERIFIED_USER_ROLE: 'VERIFIED_USER',
    USER_ROLE: 'USER',
    REJECTED_USER_ROLE: 'REJECTED', // Add rejected role
    GUEST_ROLE: 'GUEST'
};

// Add role icons here
export const ROLE_ICONS = {
    [ROLES.ADMIN_ROLE]: '👑',
    [ROLES.INSPECTOR_ROLE]: '🔍',
    [ROLES.VERIFIED_USER_ROLE]: '✓',
    [ROLES.USER_ROLE]: '👤',
    [ROLES.REJECTED_USER_ROLE]: '❌',
    [ROLES.GUEST_ROLE]: '🔒'
};

export const ROUTES = {
    // Auth & Basic Routes
    HOME: '/',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    PENDING: '/pending-verification',

    // Land Related Routes
    MY_LANDS: '/lands/my-lands',
    LAND_MARKET: '/lands/market',    // Update this
    LAND_DETAILS: '/lands/:id',
    ADD_LAND: '/lands/add',     // Update this

    // Transaction Related Routes
    LAND_REQUESTS: '/transactions/requests',
    TRANSACTION_HISTORY: '/transactions/history',
    WITHDRAWALS: '/transactions/withdrawals',  // Add this line

    // Inspector Routes
    INSPECTOR: '/inspector',
    INSPECTOR_VERIFY_USERS: '/inspector/verify-users',
    INSPECTOR_VERIFY_LANDS: '/inspector/verify-lands',
    INSPECTOR_RESOLVE_DISPUTES: '/inspector/resolve-disputes',

    // Admin Routes
    ADMIN: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_REPORTS: '/admin/reports',

    // Disputes
    DISPUTES: '/disputes',
    RAISE_DISPUTE: '/disputes/raise'
};

// Remove PROTECTED_ROUTES from here
// Remove duplicate route configurations

export const REJECTED_ALLOWED = [
    ROUTES.HOME,
    ROUTES.PENDING,
    ROUTES.REGISTER
];

// Update OWNER_ADDRESS to ensure it's in checksum format
export const OWNER_ADDRESS = ethers.getAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

// Consider rejected users as having USER_ROLE
export const hasAccess = (user, requiredRole) => {
    if (!user || !requiredRole) return false;

    // Special handling for rejected users
    if (user.isRejected) {
        return requiredRole === ROLES.USER_ROLE;
    }

    // Admin has access to everything
    if (user.isOwner) return true;

    // Role-based access checks
    switch (requiredRole) {
        case ROLES.ADMIN_ROLE:
            return user.isOwner;
        case ROLES.INSPECTOR_ROLE:
            return user.isInspector;
        case ROLES.VERIFIED_USER_ROLE:
            return user.isVerified;
        case ROLES.USER_ROLE:
            return user.isRegistered || user.isVerified;
        case ROLES.GUEST_ROLE:
            return true;
        default:
            return false;
    }
};

// Add pagination constants
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
    DEFAULT_PAGE: 0
};

// Update to use RequestStatus enum from contract
export const REQUEST_STATUS = {
    PENDING: 0,
    ACCEPTED: 1,
    REJECTED: 2,
    PAYMENT_DONE: 3,
    COMPLETED: 4
};

export const REQUEST_STATUS_LABELS = {
    [REQUEST_STATUS.PENDING]: 'Pending',
    [REQUEST_STATUS.ACCEPTED]: 'Accepted',
    [REQUEST_STATUS.REJECTED]: 'Rejected',
    [REQUEST_STATUS.PAYMENT_DONE]: 'Payment Complete',
    [REQUEST_STATUS.COMPLETED]: 'Completed'
};

// Add centralized cache configuration
export const CACHE_CONFIG = {
    DURATION: 5 * 60 * 1000, // 5 minutes
    KEYS: {
        USER_STATE: 'authUserState',
        CONTRACTS: 'authContracts',
        USER_DATA: 'userData',
        LANDS: 'userLands',
        TRANSACTIONS: 'userTransactions',
        DISPUTES: 'userDisputes'
    }
};

