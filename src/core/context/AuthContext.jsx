import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import {
    getOrInitializeContracts,
    handleContractTransaction,
    setupContractEventListeners,
    validateNetwork,
    getContractState,
    getContractStatus
} from '../../services/contractService';
import { ethers } from 'ethers';
import createLogger from '../../utils/logger';
import useWeb3 from '../hooks/useWeb3';
import { getRoleFromUser, hasAccess, getRoleName } from '../hooks/useRoles';
import { CACHE_CONFIG } from '../config';  // Add this import
import { showToast, dismissToasts } from '../../utils/toast';

export const AuthContext = createContext(null);

const initialState = {
    currentUser: null,
    error: null,
    isReady: false,
    isConnecting: false,
    contractsInitialized: false  // Add this state
};

// Update reducer to handle contract state
function authReducer(state, action) {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, currentUser: action.payload, error: null };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_READY':
            return { ...state, isReady: action.payload };
        case 'SET_CONNECTING':
            return { ...state, isConnecting: action.payload };
        case 'SET_CONTRACTS_INITIALIZED':
            return { ...state, contractsInitialized: action.payload };
        default:
            return state;
    }
}

export const AuthProvider = ({ children }) => {
    const logger = createLogger('AuthContext');
    const { account, provider, signer, isInitialized: isWeb3Initialized, connect, disconnect } = useWeb3();

    // Add initialization tracking
    const [isInitializing, setIsInitializing] = useState(false);

    const [state, dispatch] = useReducer(authReducer, initialState);

    const statusCheckInProgress = useRef(false);

    // Use centralized cache config
    const AUTH_CACHE = CACHE_CONFIG;

    const getCachedData = useCallback((key) => {
        try {
            const data = sessionStorage.getItem(key);
            const timestamp = sessionStorage.getItem(`${key}_timestamp`);

            if (data && timestamp && (Date.now() - Number(timestamp)) < AUTH_CACHE.CACHE_DURATION) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            logger.error(`Cache read failed for ${key}:`, error);
            return null;
        }
    }, []);

    const setCacheData = useCallback((key, data) => {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
            sessionStorage.setItem(`${key}_timestamp`, Date.now().toString());
        } catch (error) {
            logger.error(`Cache write failed for ${key}:`, error);
        }
    }, []);

    // Centralize contract calls
    const handleContractCall = useCallback(async (contractName, method, args = [], options = {}) => {
        try {
            // Get current contract status
            const status = getContractStatus();

            if (!status.isInitialized) {
                logger.debug('Contracts not initialized, initializing...', {
                    hasProvider: !!provider,
                    hasSigner: !!signer,
                    hasAccount: !!account
                });

                await getOrInitializeContracts(provider, signer);
            }

            // Add value to transaction if provided
            const txOptions = {
                ...options,
                ...(options.value && {
                    value: options.value,
                    gasLimit: options.gasLimit || BigInt(800000)
                })
            };

            return await handleContractTransaction(contractName, method, args, txOptions);
        } catch (error) {
            logger.error('Contract call failed:', {
                contractName,
                method,
                error: error.message
            });
            throw error;
        }
    }, [provider, signer, account]);

    useEffect(() => {
        if (state.contractsInitialized) {
            setupContractEventListeners(getContractState().contracts);
            return () => {
                const contracts = getContractState().contracts;
                if (contracts) {
                    Object.values(contracts).forEach(contract => {
                        if (contract && contract.removeAllListeners) {
                            contract.removeAllListeners();
                        }
                    });
                }
            };
        }
    }, [state.contractsInitialized]);

    const determineUserStatus = useCallback(async (contracts, address) => {
        if (!contracts?.userRegistry || !address) return null;

        try {
            // Single combined promise for all role checks and user data
            const [
                userInfo,
                inspectorRole,
                adminRole,
                verificationStatus,
                isRejected,
                cooldownTime
            ] = await Promise.all([
                contracts.userRegistry.users(address),
                contracts.userRegistry.hasRole(ethers.id("INSPECTOR_ROLE"), address),
                contracts.userRegistry.hasRole(ethers.id("ADMIN_ROLE"), address),
                contracts.userRegistry.getVerificationStatus(address),
                contracts.userRegistry.isUserRejected(address),
                contracts.userRegistry.getRejectionCooldown(address)
            ]);

            // System users (admin/inspector) don't need regular user checks
            if (adminRole || inspectorRole) {
                return {
                    address,
                    name: userInfo?.name || 'System User',
                    isRegistered: true,
                    isVerified: true,
                    isOwner: adminRole,
                    isInspector: inspectorRole,
                    isRejected: false,
                    rejectionReason: '',
                    cooldownTime: '0'
                };
            }

            // Regular user status
            if (!userInfo?.name && !isRejected) {
                return {
                    address,
                    isRegistered: false,
                    isVerified: false,
                    isOwner: false,
                    isInspector: false,
                    isRejected: false,
                    rejectionReason: '',
                    cooldownTime: '0'
                };
            }

            // Return complete user status
            return {
                address,
                name: userInfo.name,
                isRegistered: verificationStatus.isRegistered && !isRejected,
                isVerified: verificationStatus.isVerified && !isRejected,
                isOwner: adminRole,
                isInspector: inspectorRole,
                isRejected,
                rejectionReason: verificationStatus?.remarks || '',
                cooldownTime: cooldownTime.toString()
            };

        } catch (error) {
            logger.error('Error in determineUserStatus:', error);
            return null;
        }
    }, []);

    // Update initialization logic to remove signer validation
    const initializeContractsAndUser = useCallback(async (provider, signer, address) => {
        if (!provider || !signer || !address) {
            logger.debug('Missing required parameters', { provider: !!provider, signer: !!signer, address });
            return null;
        }

        setIsInitializing(true);
        logger.debug('Initializing contracts with:', { address });

        try {
            const contracts = await getOrInitializeContracts(provider, signer);
            if (!contracts) {
                throw new Error('Contract initialization failed');
            }

            setupContractEventListeners(contracts);
            dispatch({ type: 'SET_CONTRACTS_INITIALIZED', payload: true });

            return { contracts };
        } catch (error) {
            logger.error('Contract initialization failed:', error);
            dispatch({ type: 'SET_CONTRACTS_INITIALIZED', payload: false });
            return null;
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const checkUserStatus = useCallback(async (address, provider, signer) => {
        if (statusCheckInProgress.current || !address || !provider || !signer) {
            return null;
        }

        statusCheckInProgress.current = true;
        try {
            const contracts = await getOrInitializeContracts(provider, signer);
            const status = await determineUserStatus(contracts, address);

            return status;
        } catch (error) {
            logger.error('Status check failed:', error);
            return null;
        } finally {
            statusCheckInProgress.current = false;
        }
    }, [determineUserStatus]);

    const clearUserState = useCallback(() => {
        dispatch({
            type: 'SET_USER',
            payload: null
        });
    }, []);

    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Update connection handling
    const connectWallet = useCallback(async () => {
        const correlationId = Date.now();
        logger.info(`[${correlationId}] Starting auth connection flow`);

        if (state.isConnecting) {
            logger.warn(`[${correlationId}] Connection already in progress`);
            return null;
        }

        dispatch({ type: 'SET_CONNECTING', payload: true });

        try {
            logger.debug(`[${correlationId}] Connecting Web3`);
            const web3Result = await connect();
            logger.debug(`[${correlationId}] Web3 result:`, web3Result);

            if (!web3Result?.success) {
                throw new Error('Wallet connection failed');
            }

            const { provider, signer, account } = web3Result;
            logger.debug(`[${correlationId}] Initializing contracts`);
            const initResult = await initializeContractsAndUser(provider, signer, account);

            if (!initResult?.contracts) {
                logger.error(`[${correlationId}] Contract initialization failed`);
                throw new Error('Contract initialization failed');
            }

            logger.debug(`[${correlationId}] Getting user status`);
            const status = await determineUserStatus(initResult.contracts, account);

            if (status) {
                logger.info(`[${correlationId}] User status determined:`, {
                    address: status.address,
                    isVerified: status.isVerified,
                    role: status.isOwner ? 'admin' : status.isInspector ? 'inspector' : 'user'
                });
                dispatch({ type: 'SET_USER', payload: status });
                dispatch({ type: 'SET_CONTRACTS_INITIALIZED', payload: true });
            }

            return { success: true, user: status };
        } catch (error) {
            logger.error(`[${correlationId}] Auth connection failed:`, error);
            throw error;
        } finally {
            dispatch({ type: 'SET_CONNECTING', payload: false });
        }
    }, [connect, initializeContractsAndUser, determineUserStatus, state.isConnecting]);

    const logout = useCallback(async () => {
        try {
            Object.values(AUTH_CACHE).forEach(key => {
                sessionStorage.removeItem(key);
                sessionStorage.removeItem(`${key}_timestamp`);
            });
            clearUserState();
            sessionStorage.clear();
            await disconnect();
            dispatch({ type: 'SET_READY', payload: false });
            logger.debug('Auth state cleared completely');
            return true;
        } catch (error) {
            logger.error('Logout failed:', error);
            return false;
        }
    }, [clearUserState, disconnect]);

    // Update the refresh function to be more robust
    const refreshUserStatus = useCallback(async (retryCount = 3) => {
        if (statusCheckInProgress.current) {
            logger.debug('Status check already in progress, skipping');
            return;
        }

        statusCheckInProgress.current = true;
        try {
            logger.debug('Refreshing user status', { address: account });
            const contracts = await getOrInitializeContracts(provider, signer);
            const status = await determineUserStatus(contracts, account);

            if (status) {
                dispatch({ type: 'SET_USER', payload: status });
                return status;
            } else if (retryCount > 0) {
                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                return refreshUserStatus(retryCount - 1);
            }
        } catch (error) {
            if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return refreshUserStatus(retryCount - 1);
            }
            logger.error('Failed to refresh user status:', error);
            throw error;
        } finally {
            statusCheckInProgress.current = false;
        }
    }, [account, provider, signer, determineUserStatus]);

    const getUserDetails = useCallback(async (address) => {
        // Use existing cache from contractService
        return await handleContractCall('userRegistry', 'users', [address], {
            isView: true,
            cache: true
        });
    }, [handleContractCall]);

    useEffect(() => {
        if (state.currentUser) {
            try {
                // Store only necessary user data
                const userState = {
                    ...state.currentUser,
                    cooldownTime: state.currentUser.cooldownTime.toString()
                };
                sessionStorage.setItem('userState', JSON.stringify(userState));
            } catch (error) {
                logger.error('Failed to store user state:', error);
            }
        }
    }, [state.currentUser]);

    // Update the init useEffect with better logging
    useEffect(() => {
        let mounted = true;
        let initTimeout;

        const init = async () => {
            const correlationId = Date.now();
            logger.debug(`[${correlationId}] Auth initialization state:`, {
                isWeb3Initialized,
                hasProvider: !!provider,
                hasSigner: !!signer,
                hasAccount: !!account,
                isInitializing,
                currentState: state
            });

            // Only set ready state, don't attempt connection
            if (mounted) {
                dispatch({ type: 'SET_READY', payload: true });
            }
        };

        // Shorter timeout since we're just setting state
        initTimeout = setTimeout(init, 100);

        return () => {
            mounted = false;
            clearTimeout(initTimeout);
        };
    }, []);

    // Add cache utilities to context value
    const value = React.useMemo(() => ({
        authState: {
            ...state,
            isReady: state.isReady
        },
        getCachedData,
        setCacheData,
        CACHE_KEYS: AUTH_CACHE.KEYS,
        connectWallet,
        logout: disconnect,
        refreshUserStatus,
        getUserDetails,
        handleContractCall
    }), [
        state,
        connectWallet,
        disconnect,
        refreshUserStatus,
        getUserDetails,
        handleContractCall
    ]);

    // Fix event handling
    const CONTRACT_EVENTS = [
        'PurchaseRequest',
        'LandOwnership',
        'UserVerification'
    ].reduce((acc, type) => ({
        ...acc,
        [`${type}Created`]: true,
        [`${type}Updated`]: true,
        [`${type}Completed`]: true
    }), {});

    // Update event listener setup
    useEffect(() => {
        if (!state.contractsInitialized) return;

        const events = Object.keys(CONTRACT_EVENTS);
        const handleEvent = () => refreshUserStatus();

        events.forEach(event => {
            window.addEventListener(`contract:${event}`, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(`contract:${event}`, handleEvent);
            });
        };
    }, [state.contractsInitialized, refreshUserStatus]);

    // Remove duplicate init useEffect
    useEffect(() => {
        if (!isWeb3Initialized || !provider || !signer || !account) return;

        const contractState = getContractState();
        if (!contractState.isInitialized && !isInitializing) {
            initializeContractsAndUser(provider, signer, account)
                .then(() => {
                    if (mountedRef.current) {
                        dispatch({ type: 'SET_READY', payload: true });
                    }
                })
                .catch(logger.error);
        }
    }, [isWeb3Initialized, provider, signer, account]);

    // Add event handling for global state updates
    const TRANSACTION_EVENTS = [
        'LandPurchaseRequested',
        'PurchaseRequestStatusChanged',
        'PurchaseRequestCancelled',
        'LandOwnershipTransferred'
    ];

    const LAND_EVENTS = [
        'LandAdded',
        'LandVerified',
        'LandUpdated'
    ];

    useEffect(() => {
        if (!state.contractsInitialized) return;

        const handleTransactionEvent = async () => {
            await Promise.all([
                refreshUserStatus(),
                dispatch({ type: 'REFRESH_CONTRACTS' })
            ]);
        };

        [...TRANSACTION_EVENTS, ...LAND_EVENTS].forEach(event => {
            window.addEventListener(`contract:${event}`, handleTransactionEvent);
        });

        return () => {
            [...TRANSACTION_EVENTS, ...LAND_EVENTS].forEach(event => {
                window.removeEventListener(`contract:${event}`, handleTransactionEvent);
            });
        };
    }, [state.contractsInitialized, refreshUserStatus]);

    // Add registration event listener
    useEffect(() => {
        const handleRegistration = async () => {
            await refreshUserStatus();
        };

        window.addEventListener('contract:UserRegistered', handleRegistration);
        return () => window.removeEventListener('contract:UserRegistered', handleRegistration);
    }, [refreshUserStatus]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};